# SUTDWIFI-AWS-CAMERA  Example (Part b)

This example shows how ESP-CAM connects to AP with wpa2 enterprise encryption (i.e., SUTD-Wifi), start a video webserver, and do some over utlization procedure of image to text. Example does the following steps:

1. Install CA certificate which is optional.
2. Install client certificate and client key which is required in TLS method and optional in PEAP and TTLS methods.
3. Set identity of phase 1 which is optional.
4. Set user name and password of phase 2 which is required in PEAP and TTLS methods.
5. Enable wpa2 enterprise.
6. Connect to AP.
7. Once get the ip from SUTD-Wifi, start the webserver of video
8. Once get the ip from SUTD-Wifi, connect to aws
7. Once you pressed the button, i.e., connect IO12 to VCC and then release it, the ESP-CAM will try to 
  * take a photo,
  * acquire a s3 signed url
  * upload the photo
  * create a rekog query
  * turn on/off the light according to the result
Do remember this is an over utilization, and errors are as expected and even designed on purpose to help you find some IoT challenges. Your courage, exploration and potential brainstorming are more valuable than a functional ‘success'.  

*Note:* 1. The certificates currently are generated and are present in examples.wifi/wpa2_enterprise/main folder.
        2. The expiration date of the certificates is 2027/06/05.
        3. Connecting to the PEAP AP like SUTD-Wifi requires a large memory, so this may be not valid for ESP32 modules without external sram.

## How to use Example
### Configuration on SUTD-Wifi

```
idf.py menuconfig
```
Go to 'CCIoT Class Configuration' and do the follwoing:
* Check SSID of Access Point to connect in Example Configuration to be 'SUTD_Wifi'.
* Select EAP method: TLS, TTLS or PEAP (SUTD-Wifi uses PEAP).
* Select Phase2 method (only for TTLS).
* Enter EAP-ID as your student id @mymail.sutd.edu.sg. (Only do this if default configuration fails)
* Enter Username (Your student id, only numbers) and Password (The password you use to log into myportal).
* Enable or disable 'Validate Server' option. (DISABLE it for sutd wifi)
### Configuration on AWS
0. You can also reuse the settings and files of lab1_2_2, but do make sure only one device is working.
1. Go to AWS-IOT menu, click Manage->All devices->Things.
2. Follow the guide to create a new thing, use all default settings.
3. When AWS asks you to create a policy, select "allow", "*", "*". (See also main/aws_help/thingPolicy)
4. Download the certificates from AWS. Then copy the 'xxx-private.pem.key' and 'xxx-certificate.pem.crt' files to the main/certs subdirectory of the example. Rename them by removing the device-specific prefix - the new names are 'client.key' and 'client.crt' (i.e., overwrite the default empty files).
### Build and Flash the project.
* connect IO0 and GND and press the RST button
* Run the following

```
idf.py flash
```
### Debug and monitor
* Assuming you have just finish the flash and IO0 is still connected with GND, if not, connect them back
* Press the RST Button and run the following

```
idf.py monitor
```
* After you see some words in organge, saying 'idf_monitor xxxx', disconnect IO0 and GND, and press RST again
* You will see the words change into green, which means the ESP-CAM starts to work
* Find the IP when it's printed, copy/paste it to your web browser, you will see the video 

