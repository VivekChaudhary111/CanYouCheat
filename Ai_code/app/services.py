# app/proctoring_service.py
import numpy as np
import cv2
from .schema import ProctorFlags
from .models.face import FaceProcessor 
from .models.object import ObjectDetector

class ProctoringService:
    def __init__(self, object_model_path: str):
        self.face_processor = FaceProcessor()
        self.object_detector = ObjectDetector(model_path=object_model_path)
        print("ProctoringService initialized with MediaPipe FaceProcessor.")

    def process_frame(self, image: np.ndarray) -> ProctorFlags:
        """
        Runs the full proctoring pipeline on a single image.
        """
        try:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        except cv2.error:
             # Handle case where image might be empty or invalid
             return ProctorFlags(
                multiple_faces=False,
                no_face_detected=True,
                phone_detected=False,
                book_detected=False,
                is_looking_away=False,
                face_out_of_bounds=True,
            )
        
        # 1. Run face analysis
        face_flags = self.face_processor.analyze(image_rgb)
        
        # 2. Run object analysis
        object_flags = self.object_detector.analyze(image_rgb)
        
        # 3. Combine results into the final Pydantic model
        all_flags = {**face_flags, **object_flags}
        
        # Ensure all keys required by ProctorFlags are present
        final_flags = {
            "multiple_faces": all_flags.get("multiple_faces", False),
            "no_face_detected": all_flags.get("no_face_detected", True),
            "phone_detected": all_flags.get("phone_detected", False),
            "book_detected": all_flags.get("book_detected", False),
            "is_looking_away": all_flags.get("is_looking_away", False),
            "face_out_of_bounds": all_flags.get("face_out_of_bounds", True),
        }

        return ProctorFlags(**final_flags)