# app/models/face_verifier.py
import cv2
import numpy as np
from ..core.utils import base64_to_image # Use our existing helper
import traceback
import os

# Define path to the face detection model
FACE_CASCADE_PATH = os.path.join('weights', 'haarcascade_frontalface_default.xml')

class FaceVerifier:
    def __init__(self):
        """
        Initializes OpenCV's LBPH Face Recognizer and Haar Cascade for detection.
        """
        # Load face detector
        if not os.path.exists(FACE_CASCADE_PATH):
            raise FileNotFoundError(f"Face cascade model not found at {FACE_CASCADE_PATH}")
        self.face_cascade = cv2.CascadeClassifier(FACE_CASCADE_PATH)

        # Create LBPH Recognizer
        self.recognizer = cv2.face.LBPHFaceRecognizer_create()

        # Threshold: Distance value below this is considered a match.
        # This needs tuning based on testing. Start around 70. Lower is stricter.
        self.threshold = 70.0
        print("FaceVerifier initialized using OpenCV LBPH Recognizer.")

    def _get_face_roi(self, img_np: np.ndarray):
        """Detects the largest face and returns the grayscale Region of Interest (ROI)."""
        if img_np is None or img_np.size == 0:
            print("Warning: Received empty image for face detection.")
            return None
            
        gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
        # Adjust parameters for potentially different image sizes/conditions
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(100, 100) # Minimum face size to detect (pixels)
        )

        if len(faces) == 0:
            print("Warning: No face detected by Haar Cascade.")
            return None # No face found

        if len(faces) > 1:
             print("Warning: Multiple faces detected, using the largest one.")
             # Find the largest face based on area (w*h)
             faces = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)

        (x, y, w, h) = faces[0] # Get coordinates of the largest face
        return gray[y:y+h, x:x+w] # Return the grayscale ROI

    def verify_faces(self, live_image_np: np.ndarray, reference_image_np: np.ndarray) -> dict:
        """
        Compares two faces using OpenCV's LBPH recognizer.
        """
        error_msg = None
        try:
            # 1. Detect face ROI in the reference image
            reference_face_roi = self._get_face_roi(reference_image_np)
            if reference_face_roi is None:
                error_msg = "No face detected in reference image."
                print(f"FaceVerifier Error: {error_msg}")
                return {"verified": False, "distance": -1.0, "threshold": self.threshold, "model": "OpenCV LBPH", "error": error_msg}

            # 2. "Train" the LBPH recognizer *instantly* on the reference face ROI.
            # For verification, we only train on the single reference image.
            # We assign a dummy label (e.g., 1) to this face.
            labels = np.array([1])
            self.recognizer.train([reference_face_roi], labels)
            print("LBPH Recognizer trained on reference image.")

            # 3. Detect face ROI in the live image
            live_face_roi = self._get_face_roi(live_image_np)
            if live_face_roi is None:
                error_msg = "No face detected in live image."
                print(f"FaceVerifier Error: {error_msg}")
                return {"verified": False, "distance": -1.0, "threshold": self.threshold, "model": "OpenCV LBPH", "error": error_msg}

            # 4. Predict the label and confidence (distance) on the live face ROI
            predicted_label, confidence = self.recognizer.predict(live_face_roi)
            print(f"LBPH Prediction - Label: {predicted_label}, Confidence (Distance): {confidence}")

            # 5. Check if the predicted label matches our reference label (1)
            #    AND if the confidence (distance) is BELOW the threshold.
            verified = (predicted_label == 1 and confidence < self.threshold)

            return {
                "verified": bool(verified),
                "distance": round(float(confidence), 2), # LBPH confidence is distance
                "threshold": float(self.threshold),
                "model": "OpenCV LBPH",
                "error": None
            }

        except cv2.error as cv_err:
             # Catch specific OpenCV errors, e.g., during training or prediction if ROIs are bad
            error_msg = f"OpenCV error during verification: {cv_err}"
            print(f"FaceVerifier Error: {error_msg}")
            print(traceback.format_exc())
            return {"verified": False, "distance": -1.0, "threshold": self.threshold, "model": "OpenCV LBPH", "error": error_msg}
        except Exception as e:
            error_msg = f"An unexpected error occurred: {e}"
            print(f"FaceVerifier Error: {error_msg}")
            print(traceback.format_exc())
            return {"verified": False, "distance": -1.0, "threshold": self.threshold, "model": "OpenCV LBPH", "error": error_msg}