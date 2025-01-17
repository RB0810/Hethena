/* WiFi Connection Example using WPA2 Enterprise
 *
 * Original Copyright (C) 2006-2016, ARM Limited, All Rights Reserved, Apache 2.0 License.
 * Additions Copyright (C) Copyright 2015-2016 Espressif Systems (Shanghai) PTE LTD, Apache 2.0 License.
 *
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#include <string.h>
#include <stdlib.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_wifi.h"
#include "esp_wpa2.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "esp_netif.h"
#include <esp_http_server.h>
#include "esp_http_client.h"
#include "driver/uart.h"


//#include "font8x8_basic.h"
/* The examples use simple WiFi configuration that you can set via
   project configuration menu.

   If you'd rather not, just change the below entries to strings with
   the config you want - ie #define EXAMPLE_WIFI_SSID "mywifissid"

   You can choose EAP method via project configuration according to the
   configuration of AP.
*/
#define EXAMPLE_WIFI_SSID CONFIG_EXAMPLE_WIFI_SSID
#define EXAMPLE_EAP_METHOD CONFIG_EXAMPLE_EAP_METHOD

#define EXAMPLE_EAP_ID CONFIG_EXAMPLE_EAP_ID
#define EXAMPLE_EAP_USERNAME CONFIG_EXAMPLE_EAP_USERNAME
#define EXAMPLE_EAP_PASSWORD CONFIG_EXAMPLE_EAP_PASSWORD

/* FreeRTOS event group to signal when we are connected & ready to make a request */
static EventGroupHandle_t wifi_event_group;

/* esp netif object representing the WIFI station */
static esp_netif_t *sta_netif = NULL;
int isConnected=0;
/* The event group allows multiple bits for each event,
   but we only care about one event - are we connected
   to the AP with an IP? */
const int CONNECTED_BIT = BIT0;
extern void pic_app_main();
extern void initCamera();
static const char *TAG = "example";
extern httpd_handle_t start_webserver();
/* CA cert, taken from wpa2_ca.pem
   Client cert, taken from wpa2_client.crt
   Client key, taken from wpa2_client.key

   The PEM, CRT and KEY file were provided by the person or organization
   who configured the AP with wpa2 enterprise.

   To embed it in the app binary, the PEM, CRT and KEY file is named
   in the component.mk COMPONENT_EMBED_TXTFILES variable.
*/
#ifdef CONFIG_EXAMPLE_VALIDATE_SERVER_CERT
extern uint8_t ca_pem_start[] asm("_binary_wpa2_ca_pem_start");
extern uint8_t ca_pem_end[]   asm("_binary_wpa2_ca_pem_end");
#endif /* CONFIG_EXAMPLE_VALIDATE_SERVER_CERT */

#ifdef CONFIG_EXAMPLE_EAP_METHOD_TLS
extern uint8_t client_crt_start[] asm("_binary_wpa2_client_crt_start");
extern uint8_t client_crt_end[]   asm("_binary_wpa2_client_crt_end");
extern uint8_t client_key_start[] asm("_binary_wpa2_client_key_start");
extern uint8_t client_key_end[]   asm("_binary_wpa2_client_key_end");
#endif /* CONFIG_EXAMPLE_EAP_METHOD_TLS */

#if defined CONFIG_EXAMPLE_EAP_METHOD_TTLS
esp_eap_ttls_phase2_types TTLS_PHASE2_METHOD = CONFIG_EXAMPLE_EAP_METHOD_TTLS_PHASE_2;
#endif /* CONFIG_EXAMPLE_EAP_METHOD_TTLS */
int aws_iot_demo_main( int argc, char ** argv );
void awsTask()
{    
    aws_iot_demo_main(0,NULL);
}

#include "freertos/timers.h"
#include "core_mqtt.h"
esp_err_t upload_image_to_s3(char *webserver, char *url);
#include "esp_http_client.h"
#include "cJSON.h"
#include "esp_tls.h"
#include "lwip/sockets.h"
#include "driver/gpio.h"

#define WEB_PORT 443
#define LED_GPIO_PIN 4  
#define BUTTON_GPIO_PIN 12
#define SPEAKER_TX_PIN GPIO_NUM_14 // TX pin connected to MP3 module RX
#define SPEAKER_RX_PIN GPIO_NUM_2  // RX pin connected to MP3 module TX
char global_filename[64];


esp_err_t download_mp3_from_s3(const char *url) {
    esp_http_client_config_t config = {
        .url = url,
    };

    esp_http_client_handle_t client = esp_http_client_init(&config);
    if (esp_http_client_open(client, 0) != ESP_OK) {
        ESP_LOGE(TAG, "Failed to connect to S3 URL");
        esp_http_client_cleanup(client);
        return ESP_FAIL;
    }

    char buffer[512];
    int content_length = esp_http_client_fetch_headers(client);
    if (content_length <= 0) {
        ESP_LOGE(TAG, "Invalid content length");
        esp_http_client_close(client);
        esp_http_client_cleanup(client);
        return ESP_FAIL;
    }

    while (true) {
        int read_len = esp_http_client_read(client, buffer, sizeof(buffer));
        if (read_len <= 0) break;

        // Stream data to the MP3 module directly
        uart_write_bytes(UART_NUM_1, buffer, read_len);
    }

    ESP_LOGI(TAG, "MP3 file downloaded and sent to the MP3 module");
    esp_http_client_close(client);
    esp_http_client_cleanup(client);
    return ESP_OK;
}

void play_audio_file() {
    uint8_t set_volume[] = {0x7E, 0xFF, 0x06, 0x06, 0x00, 0x00, 0x1E, 0xEF};  // Set volume to 30 (maximum)
    uart_write_bytes(UART_NUM_1, (const char *)set_volume, sizeof(set_volume));
    uint8_t play_command[] = {0x7E, 0xFF, 0x06, 0x0D, 0x00, 0x00, 0x01, 0xEF};  // Play track 001.mp3
    uart_write_bytes(UART_NUM_1, (const char *)play_command, sizeof(play_command));
    ESP_LOGI(TAG, "Play command sent to MP3 module");
}

// Function to send an HTTP POST request
int send_http_request() {
    const char *hostname = "192.168.230.152";
    char post_data[256];
    
    // Construct the post_data using the global filename
    snprintf(post_data, sizeof(post_data), 
             "{\"s3_url\": \"https://bkt--390844756721.s3.ap-southeast-1.amazonaws.com/%s\"}", 
             global_filename);

    // const char *post_data = "{\"s3_url\": \"https://bkt--390844756721.s3.ap-southeast-1.amazonaws.com/images/project.jpg\"}";

    char url[256];
    snprintf(url, sizeof(url), "http://%s/process-image", hostname);

    // HTTP client configuration
    esp_http_client_config_t config = {
        .url = url,
        .method = HTTP_METHOD_POST,
    };

    // Initialize the HTTP client
    esp_http_client_handle_t client = esp_http_client_init(&config);

    // Set headers and POST data
    esp_http_client_set_header(client, "Content-Type", "application/json");
    esp_http_client_set_post_field(client, post_data, strlen(post_data));

    // Perform the HTTP request
    esp_err_t err = esp_http_client_perform(client);
    if (err == ESP_OK) {
        int status_code = esp_http_client_get_status_code(client);
        ESP_LOGI(TAG, "HTTP POST Status = %d", status_code);

        // If the request was successful
        if (status_code == 200) {
            ESP_LOGI(TAG, "Response successful");
        } else {
            ESP_LOGE(TAG, "HTTP request failed with status code %d", status_code);
        }
    } else {
        ESP_LOGE(TAG, "HTTP POST request failed: %s", esp_err_to_name(err));
    }

    // Clean up the HTTP client
    esp_http_client_cleanup(client);
    return err == ESP_OK ? ESP_OK : ESP_FAIL;
}

void init_uart() {
    uart_config_t uart_config = {
        .baud_rate = 9600,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE
    };
    uart_param_config(UART_NUM_1, &uart_config);
    uart_set_pin(UART_NUM_1, SPEAKER_RX_PIN, SPEAKER_TX_PIN, UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE);
    uart_driver_install(UART_NUM_1, 1024, 0, 0, NULL, 0);
}


// Function to check button press and trigger image capture
void check_button_and_capture() {
    int button_state = gpio_get_level(BUTTON_GPIO_PIN);
    if (button_state == 1) { // If button is pressed
        ESP_LOGI(TAG, "Button pressed, capturing image...");

        time_t now;
        struct tm timeinfo;
        
        time(&now);
        localtime_r(&now, &timeinfo);
        
        snprintf(global_filename, sizeof(global_filename), "images/photo_%ld.jpg", now);

        char s3_url[256];
        snprintf(s3_url, sizeof(s3_url), "bkt--390844756721/%s", global_filename);
        ESP_LOGI(TAG, "Generated S3 URL: %s", s3_url);

        // Upload the image to S3
        esp_err_t upload_status = upload_image_to_s3("s3.ap-southeast-1.amazonaws.com", s3_url);
        
        // Call your function to take picture and upload to S3
        // esp_err_t upload_status = upload_image_to_s3("s3.ap-southeast-1.amazonaws.com", "bkt--390844756721/images/photodemo.jpg");
        
        if (upload_status == ESP_OK) {
            ESP_LOGI(TAG, "Picture uploaded successfully, sending HTTP request...");
            send_http_request();
        } else {
            ESP_LOGE(TAG, "Failed to upload picture!");
        }
    }
}

static void event_handler(void* arg, esp_event_base_t event_base,
                                int32_t event_id, void* event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        esp_wifi_connect();
        xEventGroupClearBits(wifi_event_group, CONNECTED_BIT);
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        xEventGroupSetBits(wifi_event_group, CONNECTED_BIT);
        isConnected = 1;

        httpd_handle_t server = start_webserver();
    }
}


static void initialise_wifi(void)
{
#ifdef CONFIG_EXAMPLE_VALIDATE_SERVER_CERT
    unsigned int ca_pem_bytes = ca_pem_end - ca_pem_start;
#endif /* CONFIG_EXAMPLE_VALIDATE_SERVER_CERT */

#ifdef CONFIG_EXAMPLE_EAP_METHOD_TLS
    unsigned int client_crt_bytes = client_crt_end - client_crt_start;
    unsigned int client_key_bytes = client_key_end - client_key_start;
#endif /* CONFIG_EXAMPLE_EAP_METHOD_TLS */

    ESP_ERROR_CHECK(esp_netif_init());
    wifi_event_group = xEventGroupCreate();
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    sta_netif = esp_netif_create_default_wifi_sta();
    assert(sta_netif);

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK( esp_wifi_init(&cfg) );
    ESP_ERROR_CHECK( esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &event_handler, NULL) );
    ESP_ERROR_CHECK( esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &event_handler, NULL) );
    ESP_ERROR_CHECK( esp_wifi_set_storage(WIFI_STORAGE_RAM) );
    wifi_config_t wifi_config = {
        .sta = {
            .ssid = "ONEPLUS_co_apsxar",
            .password = "xxxxxxx"
        },
    };
    ESP_LOGI(TAG, "Setting WiFi configuration SSID %s...", wifi_config.sta.ssid);
    ESP_ERROR_CHECK( esp_wifi_set_mode(WIFI_MODE_STA) );
    ESP_ERROR_CHECK( esp_wifi_set_config(WIFI_IF_STA, &wifi_config) );
    // ESP_ERROR_CHECK( esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)EXAMPLE_EAP_ID, strlen(EXAMPLE_EAP_ID)) );

#ifdef CONFIG_EXAMPLE_VALIDATE_SERVER_CERT
    ESP_ERROR_CHECK( esp_wifi_sta_wpa2_ent_set_ca_cert(ca_pem_start, ca_pem_bytes) );
#endif /* CONFIG_EXAMPLE_VALIDATE_SERVER_CERT */

#ifdef CONFIG_EXAMPLE_EAP_METHOD_TLS
    ESP_ERROR_CHECK( esp_wifi_sta_wpa2_ent_set_cert_key(client_crt_start, client_crt_bytes,\
    		client_key_start, client_key_bytes, NULL, 0) );
#endif /* CONFIG_EXAMPLE_EAP_METHOD_TLS */

#if defined CONFIG_EXAMPLE_EAP_METHOD_PEAP || CONFIG_EXAMPLE_EAP_METHOD_TTLS
    // ESP_ERROR_CHECK( esp_wifi_sta_wpa2_ent_set_username((uint8_t *)EXAMPLE_EAP_USERNAME, strlen(EXAMPLE_EAP_USERNAME)) );
    // ESP_ERROR_CHECK( esp_wifi_sta_wpa2_ent_set_password((uint8_t *)EXAMPLE_EAP_PASSWORD, strlen(EXAMPLE_EAP_PASSWORD)) );
#endif /* CONFIG_EXAMPLE_EAP_METHOD_PEAP || CONFIG_EXAMPLE_EAP_METHOD_TTLS */

#if defined CONFIG_EXAMPLE_EAP_METHOD_TTLS
    ESP_ERROR_CHECK( esp_wifi_sta_wpa2_ent_set_ttls_phase2_method(TTLS_PHASE2_METHOD) );
#endif /* CONFIG_EXAMPLE_EAP_METHOD_TTLS */

    // ESP_ERROR_CHECK( esp_wifi_sta_wpa2_ent_enable() );
    ESP_ERROR_CHECK( esp_wifi_start() );
}

static void showIP(){
    esp_netif_ip_info_t ip;
    memset(&ip, 0, sizeof(esp_netif_ip_info_t));
    char str[64];
    //vTaskDelay(2000 / portTICK_PERIOD_MS);
        if (esp_netif_get_ip_info(sta_netif, &ip) == 0) {
            ESP_LOGI(TAG, "~");
            ESP_LOGI(TAG, "IP:"IPSTR, IP2STR(&ip.ip));
            ESP_LOGI(TAG, "MASK:"IPSTR, IP2STR(&ip.netmask));
            ESP_LOGI(TAG, "GW:"IPSTR, IP2STR(&ip.gw));
            ESP_LOGI(TAG, "~");

        }

}


void app_main(void) {
    ESP_ERROR_CHECK(nvs_flash_init());
    initCamera();
    init_uart();

    // Configure LED GPIO
    gpio_reset_pin(LED_GPIO_PIN);
    gpio_set_direction(LED_GPIO_PIN, GPIO_MODE_OUTPUT);
    gpio_set_level(LED_GPIO_PIN, 0);

    // Set up WiFi
    initialise_wifi();
    while (!isConnected);
    showIP();

    // Configure the button GPIO
    gpio_set_direction(BUTTON_GPIO_PIN, GPIO_MODE_INPUT);
    gpio_set_pull_mode(BUTTON_GPIO_PIN, GPIO_PULLDOWN_ONLY); // Set pull-down resistor

    // Main loop to check button status
    while (true) {
        check_button_and_capture();
        vTaskDelay(pdMS_TO_TICKS(200)); // Poll button every200ms
    }
}