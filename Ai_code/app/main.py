# app/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .schema import ImageRequest, ProctorFlags, FaceVerificationRequest, FaceVerificationResponse
from .services import ProctoringService
from .models.face_verifier import FaceVerifier
from .core.utils import base64_to_image
import os
import cv2

app_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load AI models on startup."""
    print("AI Service: Lifespan startup...")

    # --- Load Proctoring Models (MediaPipe) ---
    custom_model_path = './weights/best.pt'
    object_model_path = custom_model_path if os.path.exists(custom_model_path) else 'yolov8n.pt'
    print(f"Using YOLO model: {object_model_path}")
    try:
        app_state["proctoring_service"] = ProctoringService(object_model_path=object_model_path)
        print("Proctoring Service loaded successfully (MediaPipe/YOLOv8).")
    except Exception as e:
        print(f"FATAL ERROR loading Proctoring Service: {e}")

    try:
        app_state["face_verifier"] = FaceVerifier()
        print("Face Verifier loaded successfully (using OpenCV LBPH).")
    except Exception as e:
        print(f"FATAL ERROR loading Face Verifier: {e}")

    yield

    # --- Code here runs on shutdown ---
    app_state.clear()
    print("AI Service: Service shut down and resources cleared.")

# --- Create FastAPI App ---
app = FastAPI(title="AI Proctoring Service", lifespan=lifespan)

# --- Add CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency Functions ---
def get_proctoring_service() -> ProctoringService:
    """Dependency for the main proctoring service."""
    service = app_state.get("proctoring_service")
    if not service:
        raise HTTPException(status_code=503, detail="Proctoring Service is not ready")
    return service

def get_face_verifier() -> FaceVerifier:
    """Dependency for the face verification service."""
    verifier = app_state.get("face_verifier")
    if not verifier:
        raise HTTPException(status_code=503, detail="Face Verifier Service is not ready")
    return verifier

# --- API Endpoints ---
@app.post("/proctor", response_model=ProctorFlags)
async def proctor_endpoint(
    request: ImageRequest,
    service: ProctoringService = Depends(get_proctoring_service)
):
    """Main proctoring endpoint for during the exam."""
    image = base64_to_image(request.image)
    flags = service.process_frame(image)
    # print(f"Proctor Flags returned: {flags.model_dump()}") # Reduce logging noise maybe
    return flags

# --- NEW Face Verification Endpoint ---
@app.post("/verify_face", response_model=FaceVerificationResponse)
async def verify_face_endpoint(
    request: FaceVerificationRequest,
    verifier: FaceVerifier = Depends(get_face_verifier) # Correctly gets the OpenCV verifier
):
    """Verifies if the live face matches the reference face using OpenCV LBPH."""
    print("Received request for face verification using OpenCV LBPH.")
    try:
        # Decode both images
        live_image_np = base64_to_image(request.live_image_base64)
        reference_image_np = base64_to_image(request.reference_image_base64)

        # Perform verification using the OpenCV verifier
        verification_result = verifier.verify_faces(live_image_np, reference_image_np)

        print(f"Verification result: {verification_result}")
        return FaceVerificationResponse(**verification_result)

    except HTTPException as http_exc:
        # Handle base64 decoding errors
        print(f"Error during image decoding for verification: {http_exc.detail}")
        return FaceVerificationResponse(
            verified=False, distance=-1.0, threshold=verifier.threshold, model="OpenCV LBPH", error=http_exc.detail
        )
    except Exception as e:
        # Catch unexpected errors
        print(f"Unexpected error in /verify_face endpoint: {e}")
        return FaceVerificationResponse(
            verified=False, distance=-1.0, threshold=verifier.threshold, model="OpenCV LBPH", error=f"An internal error occurred: {e}"
        )


@app.get("/")
async def root():
    """Root endpoint to check if the server is running."""
    # Update message to reflect the stack being used
    return {"message": "AI Proctoring Service is running (MediaPipe/YOLOv8/OpenCV Verify)."}

# --- (uvicorn_runner.py remains the same) ---