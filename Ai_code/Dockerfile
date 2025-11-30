# Use Python 3.10
FROM python:3.10

# Set working directory
WORKDIR /code

# Install system dependencies for OpenCV and DeepFace
# FIX: Replaced 'libgl1-mesa-glx' (deprecated) with 'libgl1'
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    cmake \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install them
COPY requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the rest of the application
COPY app /code/app

# Copy weights/models
COPY yolov8n.pt /code/yolov8n.pt
# COPY weights /code/weights  <-- Uncomment if you uploaded the weights folder

# Create a non-root user (Required by Hugging Face)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Expose port 7860 (Hugging Face default)
EXPOSE 7860

# Start the app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]