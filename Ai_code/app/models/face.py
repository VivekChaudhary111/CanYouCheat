# app/models/face_processor.py
import mediapipe as mp
import numpy as np

class FaceProcessor:
    def __init__(self, max_faces=2, min_detection_confidence=0.5):
        """Initializes the MediaPipe Face Mesh model."""
        self.mp_face_mesh = mp.solutions.face_mesh
        # Use static_image_mode=False for video streams
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=max_faces,
            min_detection_confidence=min_detection_confidence,
            static_image_mode=False 
        )

    def analyze(self, image_rgb: np.ndarray) -> dict:
        """
        Analyzes the image for face-related flags using MediaPipe:
        - No face detected
        - Multiple faces detected
        - Gaze direction (looking away)
        - Face out of bounds
        """
        flags = {
            "multiple_faces": False,
            "no_face_detected": True,
            "is_looking_away": False,
            "face_out_of_bounds": True, # <-- Default to True
        }
        
        img_h, img_w = image_rgb.shape[:2] # Get image dimensions

        # Process the image and find faces
        results = self.face_mesh.process(image_rgb)
        
        # Check for face detection
        if results.multi_face_landmarks:
            flags["no_face_detected"] = False
            num_faces = len(results.multi_face_landmarks)

            # Check for multiple faces
            if num_faces > 1:
                flags["multiple_faces"] = True
                # Keep face_out_of_bounds as True if multiple faces
                return flags
            else:
                # --- Single Face Detected: Check Bounds and Gaze ---
                face_landmarks = results.multi_face_landmarks[0]
                
                # ** Check if face landmarks are reasonably centered **
                # Use nose tip (landmark 1) as a proxy for face center
                nose_tip = face_landmarks.landmark[1]
                
                # MediaPipe gives normalized coordinates (0.0 to 1.0)
                face_center_x_norm = nose_tip.x
                face_center_y_norm = nose_tip.y
                
                # --- Tune these boundary thresholds (normalized) ---
                x_min_norm = 0.25 
                x_max_norm = 0.75
                y_min_norm = 0.20
                y_max_norm = 0.80

                if (x_min_norm < face_center_x_norm < x_max_norm and
                    y_min_norm < face_center_y_norm < y_max_norm):
                    flags["face_out_of_bounds"] = False # Face is within bounds
                else:
                    flags["face_out_of_bounds"] = True # Face is outside bounds

                # --- Only check gaze if face is IN bounds ---
                if not flags["face_out_of_bounds"]:
                    flags["is_looking_away"] = self.check_gaze(
                        face_landmarks,
                        (img_h, img_w) # Pass image dimensions
                    )
                else:
                    # If face is out of bounds, don't check gaze (it's unreliable)
                    flags["is_looking_away"] = False 
        
        # If no landmarks were found initially
        else:
             flags["no_face_detected"] = True
             flags["face_out_of_bounds"] = True # No face means out of bounds
             flags["is_looking_away"] = False


        return flags

    def check_gaze(self, face_landmarks, shape) -> bool:
        """
        Estimates gaze direction using MediaPipe landmarks.
        Returns True if looking away, False if looking center.
        """
        try:
            # Get image dimensions from shape tuple
            img_h, img_w = shape
            
            # Key landmarks (indices might vary slightly based on model version)
            # Using inner eye corners and nose tip
            left_eye_coords = face_landmarks.landmark[33]
            right_eye_coords = face_landmarks.landmark[263]
            nose_tip_coords = face_landmarks.landmark[1]

            # Convert normalized coords to pixel coords (optional, could work with normalized)
            left_eye_x = int(left_eye_coords.x * img_w)
            right_eye_x = int(right_eye_coords.x * img_w)
            nose_tip_x = int(nose_tip_coords.x * img_w)
            
            # Calculate the center point between the inner eyes
            eye_center_x = (left_eye_x + right_eye_x) // 2
            
            # Calculate total pixel distance between inner eyes
            eye_distance = abs(right_eye_x - left_eye_x)
            if eye_distance < 1: # Avoid division by zero or tiny distances
                return False 

            # Calculate how far the nose tip is from the eye center, as a ratio
            offset = nose_tip_x - eye_center_x
            # Normalize the offset by the eye distance
            gaze_ratio = offset / eye_distance 

            # Define thresholds for looking away.
            # --- Tune this threshold value (e.g., 0.3 means nose is 30% off-center) ---
            gaze_threshold = 0.3 
            if abs(gaze_ratio) > gaze_threshold:
                return True  # Looking significantly left or right
            else:
                return False # Looking relatively center

        except IndexError:
            # Handle cases where landmark indices might be out of range
            print("Warning: Could not access expected landmarks for gaze detection.")
            return False
        except Exception as e:
            print(f"Error in MediaPipe gaze detection: {e}")
            return False