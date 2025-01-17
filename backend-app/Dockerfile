FROM python:3.9-slim

# Install dependencies for Tesseract
RUN apt-get update && \
    apt-get install -y tesseract-ocr && \
    apt-get clean

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . /app

WORKDIR /app

# Expose the port and run the FastAPI app
EXPOSE 5000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
