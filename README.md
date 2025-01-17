# Hethena
A reading device for the partially visually impaired wherein they can click a photo of the text they wish to read and audio is outputted in the language they selected in the mobile app. This is done using OCR, translation and TTS services. The backend-app folder has the code to these services and is hosted as a Kubernetes cluster that the device sends api requests to. The api request has the cpatured image as the body and the audio file as the output. This audio file is then played by the mobile app. <p>

Video Link: https://youtube.com/shorts/ud9c4VQtt5M?feature=share <br/>
The quick start guide and technical documentation (including system design) can be found as pdfs in the root directory of the repository
