import base64
import numpy as np
import cv2
from fastapi import HTTPException

def base64_to_image(base64_string: str) -> np.ndarray:
    #Decodes a base64 string into an OpenCV image (numpy array).
    try:
        # Check if the string contains the 'data:image...' prefix
        if "," in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode the base64 string
        img_bytes = base64.b64decode(base64_string)
        
        # Convert bytes to a numpy array
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        
        # Decode the numpy array into an OpenCV image
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Could not decode image")
        return img
        
    except Exception as e:
        # Raise an HTTPException that FastAPI will send as a 400 error
        raise HTTPException(status_code=400, detail=f"Error decoding image: {str(e)}")