from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
import traceback
from typing import Optional

# Import your existing models
from app.models.face_verifier import verify_faces
from app.models.face_counter import count_faces
from app.models.object_detector import detect_objects
# from app.services import decode_base64_image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="CanYouCheat AI Service",
    version="1.0.0",
    description="AI Proctoring and Analysis Service"
)

# CORS middleware for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://can-you-cheat.vercel.app/",
        "https://canyoucheat.onrender.com",
        "http://localhost:3000",
        "http://localhost:5000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class FacePayload(BaseModel):
    img1_base64: str
    img2_base64: str

class ProctoringRequest(BaseModel):
    image: str

class ProctoringResponse(BaseModel):
    success: bool
    face_count: dict
    object_detection: dict
    audio_analysis: Optional[dict] = None
    error: Optional[str] = None

@app.get("/")
async def root():
    return {
        "message": "CanYouCheat AI Service",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AI Proctoring Service",
        "models_loaded": True
    }

@app.post("/verify_faces/")
async def verify_faces_endpoint(payload: FacePayload):
    """Face verification endpoint"""
    try:
        logger.info("🔍 Face verification request received")
        
        result = verify_faces(payload.img1_base64, payload.img2_base64)
        
        logger.info("✅ Face verification completed")
        return result
        
    except Exception as e:
        logger.error(f"❌ Face verification error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/proctor", response_model=ProctoringResponse)
async def proctor_route(file: UploadFile = File(...)):
    """Main proctoring endpoint"""
    try:
        logger.info("🤖 Proctoring analysis request received")
        
        # Read image file
        image_data = await file.read()
        
        # Convert to numpy array for processing
        import cv2
        import numpy as np
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        logger.info(f"✅ Image processed: {frame.shape}")
        
        # Initialize results
        results = {
            "face_count": {"face_count": 0, "bounding_boxes": []},
            "object_detection": {"detections": []},
            "audio_analysis": {"noise_level": 0, "speech_detected": False}
        }
        
        # Face detection
        try:
            face_result = count_faces(frame)
            results["face_count"] = face_result
            logger.info(f"🔍 Face detection: {face_result.get('face_count', 0)} faces")
        except Exception as e:
            logger.error(f"❌ Face detection error: {str(e)}")
            results["face_count"]["error"] = str(e)
        
        # Object detection
        try:
            object_result = detect_objects(frame)
            results["object_detection"] = object_result
            logger.info(f"📱 Object detection: {len(object_result.get('detections', []))} objects")
        except Exception as e:
            logger.error(f"❌ Object detection error: {str(e)}")
            results["object_detection"]["error"] = str(e)
        
        response = ProctoringResponse(
            success=True,
            face_count=results["face_count"],
            object_detection=results["object_detection"],
            audio_analysis=results["audio_analysis"]
        )
        
        logger.info("✅ Proctoring analysis completed successfully")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Proctoring analysis error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)