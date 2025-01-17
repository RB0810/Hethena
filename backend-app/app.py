import os
import json
from fastapi import FastAPI, HTTPException
import boto3
import pytesseract
import cv2
from gtts import gTTS
import firebase_admin
from firebase_admin import credentials, firestore
from urllib.parse import urlparse
from dotenv import load_dotenv
import requests
from io import BytesIO
import numpy as np
from PIL import Image
import tempfile
from translate import Translator  # Using open-source translate

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI()

# Initialize Firebase Admin SDK for Firestore
cred = credentials.Certificate(os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY_PATH'))
firebase_admin.initialize_app(cred)
access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')

# Initialize Firebase Firestore
db = firestore.client()

# Initialize boto3 client for S3 access
s3_client = boto3.client('s3', aws_access_key_id=access_key_id, 
                         aws_secret_access_key=secret_access_key)

def download_image_from_s3(s3_url):
    """Download image from S3 using the provided URL."""
    parsed_url = urlparse(s3_url)
    bucket_name = parsed_url.netloc.split('.')[0]  # Extract bucket name from the URL
    object_key = parsed_url.path.lstrip('/')  # Extract object key from the URL

    # Get the image from S3
    img_data = s3_client.get_object(Bucket=bucket_name, Key=object_key)
    return img_data['Body'].read()

def perform_ocr(image_bytes):
    """Use Tesseract OCR to extract text from the image."""
    # Convert bytes to a numpy array for OpenCV
    image_array = np.frombuffer(image_bytes, np.uint8)
    
    # Use OpenCV to decode the image
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    
    # Convert the image to grayscale for better OCR results
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Perform OCR using Tesseract
    text = pytesseract.image_to_string(gray_image)
    return text

def translate_text(text, target_language):
    """Translate the text using the open-source 'translate' library."""
    if target_language != 'en':  # No translation needed if language is English
        translator = Translator(to_lang=target_language)
        translation = translator.translate(text)
        return translation
    return text

def generate_audio_from_text(text, language):
    """Generate an audio file from the translated text using gTTS."""
    tts = gTTS(text, lang=language)
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
        audio_file_path = tmp_file.name  # Get the temporary file path
        tts.save(audio_file_path)  # Save the audio file to the temporary file

    return audio_file_path

def upload_audio_to_s3(audio_file_path):
    """Upload the generated audio file to AWS S3."""
    bucket_name = os.environ.get('S3_BUCKET_NAME')  # Use your S3 bucket name from environment variable
    s3_key = "audio_output.mp3"  # Save as audio_output.mp3 in the root directory of the S3 bucket

    # Upload the file to S3
    s3_client.upload_file(audio_file_path, bucket_name, s3_key)

    # S3 URL for the uploaded audio file (public by default)
    audio_url = f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"
    return audio_url

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

@app.post("/process-image")
async def process_image(data: dict):
    s3_url = data.get("s3_url")
    
    if not s3_url:
        raise HTTPException(status_code=400, detail="Missing s3_url in request")

    try:
        # Step 1: Download the image from S3
        image_bytes = download_image_from_s3(s3_url)
        
        # Step 2: Perform OCR on the image using Tesseract
        ocr_text = perform_ocr(image_bytes)
        if not ocr_text:
            raise HTTPException(status_code=400, detail="No text detected in the image")

        # Step 3: Get the selected language from Firestore
        user_id = "xNwO27vtsnNkguN452mb6xyKeIH3"
        user_ref = db.collection('users').document(user_id)

        # Fetch the selected language
        user_doc = user_ref.get()
        if user_doc.exists:
            selected_language = user_doc.to_dict().get('selectLanguageCode', 'en')  # Default to 'en' if not found
        else:
            selected_language = 'en'

        # Step 4: Append the image URL to the 'images' array in Firestore
        user_ref.update({
            'images': firestore.ArrayUnion([s3_url])  # Add the image URL to the array
        })
        print(ocr_text)
        print(selected_language)

        # Step 5: Translate the text if necessary
        translated_text = translate_text(ocr_text, selected_language)
        print(translated_text)

        # Step 6: Generate audio from the translated text
        audio_file_path = generate_audio_from_text(translated_text, selected_language)
        
        # Step 7: Upload audio to S3
        audio_url = upload_audio_to_s3(audio_file_path)

        user_ref.update({
            'play': 1  
        })
        
        return {
            "message": "Processed successfully",
            "image_url": s3_url,
            "audio_url": audio_url
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
