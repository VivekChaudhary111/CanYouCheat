# modules/face_analyzer.py

import cv2
import numpy as np
import mediapipe as mp
import math

class FaceAnalyzer:
    def __init__(self, max_faces=5, min_detection_conf=0.5, min_tracking_conf=0.5):
        """Initializes the MediaPipe Face Mesh model."""
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=max_faces,
            refine_landmarks=True,
            min_detection_confidence=min_detection_conf,
            min_tracking_confidence=min_tracking_conf
        )
        
        # --- ADDED FOR SMOOTHING ---
        self.smooth_yaw = 0
        self.smooth_pitch = 0
        # Alpha is the smoothing factor. Lower value = more smoothing.
        self.alpha = 0.1 
        
        print("FaceAnalyzer initialized.")

    def analyze(self, frame, img_w, img_h):
        """
        Analyzes a single frame for face count and head pose.
        Now includes smoothing for more stable results.
        """
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_count = 0
        head_pose_status = "No Face Detected"
        annotated_frame = frame.copy()

        results = self.face_mesh.process(frame_rgb)

        if results.multi_face_landmarks:
            face_count = len(results.multi_face_landmarks)

            if face_count > 1:
                head_pose_status = "Multiple Faces Detected"
            elif face_count == 1:
                landmarks = results.multi_face_landmarks[0].landmark
                
                face_2d = np.array([
                    (landmarks[1].x * img_w, landmarks[1].y * img_h), (landmarks[152].x * img_w, landmarks[152].y * img_h),
                    (landmarks[263].x * img_w, landmarks[263].y * img_h), (landmarks[33].x * img_w, landmarks[33].y * img_h),
                    (landmarks[287].x * img_w, landmarks[287].y * img_h), (landmarks[57].x * img_w, landmarks[57].y * img_h)
                ], dtype=np.float64)

                face_3d = np.array([
                    [0.0, 0.0, 0.0], [0.0, -330.0, -65.0], [-225.0, 170.0, -135.0],
                    [225.0, 170.0, -135.0], [-150.0, -150.0, -125.0], [150.0, -150.0, -125.0]
                ], dtype=np.float64)

                cam_matrix = np.array([[img_w, 0, img_h / 2], [0, img_w, img_h / 2], [0, 0, 1]])
                dist_coeffs = np.zeros((4, 1), dtype=np.float64)

                success, rot_vec, trans_vec = cv2.solvePnP(face_3d, face_2d, cam_matrix, dist_coeffs)
                
                if success:
                    axis = np.float32([[200, 0, 0], [0, 200, 0], [0, 0, 200]])
                    imgpts, _ = cv2.projectPoints(axis, rot_vec, trans_vec, cam_matrix, dist_coeffs)
                    nose_tip = (int(face_2d[0][0]), int(face_2d[0][1]))
                    
                    cv2.line(annotated_frame, nose_tip, tuple(imgpts[0].ravel().astype(int)), (0, 0, 255), 3)
                    cv2.line(annotated_frame, nose_tip, tuple(imgpts[1].ravel().astype(int)), (0, 255, 0), 3)
                    cv2.line(annotated_frame, nose_tip, tuple(imgpts[2].ravel().astype(int)), (255, 0, 0), 3)

                    rmat, _ = cv2.Rodrigues(rot_vec)
                    angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)
                    
                    # --- SMOOTHING LOGIC ---
                    # Get the raw angles
                    raw_yaw = angles[1]
                    raw_pitch = angles[0]
                    
                    # Apply the EMA filter
                    self.smooth_yaw = self.alpha * raw_yaw + (1 - self.alpha) * self.smooth_yaw
                    self.smooth_pitch = self.alpha * raw_pitch + (1 - self.alpha) * self.smooth_pitch

                    # Use the smoothed angles for classification
                    if self.smooth_yaw < -10: head_pose_status = "Looking Left"
                    elif self.smooth_yaw > 10: head_pose_status = "Looking Right"
                    elif self.smooth_pitch < -10: head_pose_status = "Looking Down"
                    elif self.smooth_pitch > 10: head_pose_status = "Looking Up"
                    else: head_pose_status = "Facing Forward"

        return {"face_count": face_count, "head_pose": head_pose_status, "annotated_frame": annotated_frame}

    def close(self):
        """Releases the model resources."""
        self.face_mesh.close()