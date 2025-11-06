# app/schemas.py
from pydantic import BaseModel

class ImageRequest(BaseModel):
    """Request for the main proctoring loop."""
    image: str

class ProctorFlags(BaseModel):
    """Response for the main proctoring loop."""
    multiple_faces: bool
    no_face_detected: bool
    phone_detected: bool
    book_detected: bool
    is_looking_away: bool
    face_out_of_bounds: bool

# --- Add these new schemas ---
class FaceVerificationRequest(BaseModel):
    """Request for the face verification endpoint."""
    live_image_base64: str  # Image captured from webcam
    reference_image_base64: str # Trusted image from DB

class FaceVerificationResponse(BaseModel):
    """Response for the face verification endpoint."""
    verified: bool          # True if faces match, False otherwise
    distance: float         # Confidence score (lower means more similar for LBPH)
    threshold: float        # The threshold used for verification
    model: str              # Which face recognition model was used
    error: str | None = None # Optional error message