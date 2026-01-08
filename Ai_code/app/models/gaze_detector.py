import cv2
import mediapipe as mp
import numpy as np

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True, 
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# --- CONFIGURATION: THE VIRTUAL FOCUS BOX ---
# The student must keep their nose within this box (relative to screen)
# 0.0 is Left/Top, 1.0 is Right/Bottom
BOX_MIN_X = 0.25
BOX_MAX_X = 0.75
BOX_MIN_Y = 0.20
BOX_MAX_Y = 0.80

def get_horizontal_ratio(landmarks):
    """
    Calculates Yaw (Turning) based on 2D ratios.
    Returns: 0.0 (Left) -- 0.5 (Center) -- 1.0 (Right)
    """
    nose = landmarks.landmark[1]
    left_ear = landmarks.landmark[234]
    right_ear = landmarks.landmark[454]

    dist_to_left = abs(nose.x - left_ear.x)
    dist_to_right = abs(nose.x - right_ear.x)
    
    total_width = dist_to_left + dist_to_right
    if total_width == 0: return 0.5

    return dist_to_left / total_width

def get_vertical_ratio(landmarks):
    """
    Calculates Pitch (Looking Up/Down) based on 2D ratios.
    Returns: Ratio. Higher value = Looking Down.
    """
    nose = landmarks.landmark[1]
    chin = landmarks.landmark[152]
    # Midpoint of eyes (approximately the brow line)
    eye_mid_y = (landmarks.landmark[33].y + landmarks.landmark[263].y) / 2
    
    # Total Face Height (Brow to Chin)
    face_height = abs(chin.y - eye_mid_y)
    if face_height == 0: return 0.5
    
    # Nose Position (Brow to Nose)
    nose_pos = abs(nose.y - eye_mid_y)
    
    # Ratio: How far down is the nose?
    # Normal is ~0.30 - 0.40
    # Looking Down: Nose drops -> Ratio Increases (> 0.50)
    return nose_pos / face_height

def detect_gaze(frame):
    if frame is None:
        return {"status": "error", "details": "Empty Frame"}

    # Most webcams mirror the image. 
    # If the user moves Left and the image moves Right, use flip.
    # If it is already intuitive, comment this out.
    # frame = cv2.flip(frame, 1)

    img_h, img_w, _ = frame.shape
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)

    if not results.multi_face_landmarks:
        return {"status": "neutral", "details": "No Face"}

    landmarks = results.multi_face_landmarks[0]
    
    # --- 1. VIRTUAL BOX CHECK ---
    nose = landmarks.landmark[1]
    in_box = (BOX_MIN_X < nose.x < BOX_MAX_X) and (BOX_MIN_Y < nose.y < BOX_MAX_Y)
    
    if not in_box:
        return {
            "status": "warning", 
            "details": "Sit Center", 
            "bounds": [BOX_MIN_X, BOX_MIN_Y, BOX_MAX_X, BOX_MAX_Y],
            "scores": {}
        }

    # --- 2. CALCULATE RATIOS ---
    yaw_ratio = get_horizontal_ratio(landmarks)
    vert_ratio = get_vertical_ratio(landmarks)

    # --- 3. THRESHOLDS ---
    
    # Vertical (Pitch) - CHECKED FIRST
    # Lowered limit to 0.50 to catch "Looking Down" earlier
    # Normal ratio is around 0.35. 
    # If it goes above 0.50, the nose is noticeably lower.
    VERT_DOWN_LIMIT = 0.50 
    VERT_UP_LIMIT = 0.20   

    # Horizontal (Yaw)
    # 0.5 is Center.
    YAW_LEFT_LIMIT = 0.65  # Looking Left
    YAW_RIGHT_LIMIT = 0.75 # Looking Right

    status = "ok"
    details = "Focused"

    # --- LOGIC PRIORITY CHANGE ---
    # We check Vertical FIRST. If you are looking down, we flag it immediately.
    # This prevents the "Squashed Face" effect from triggering a false "Left".
    
    if vert_ratio > VERT_DOWN_LIMIT:
        status = "warning"
        details = "Head Down"
    elif vert_ratio < VERT_UP_LIMIT:
        status = "warning"
        details = "Head Up"
    elif yaw_ratio < YAW_LEFT_LIMIT:
        status = "warning"
        details = "Head Left"
    elif yaw_ratio > YAW_RIGHT_LIMIT:
        status = "warning"
        details = "Head Right"

    return {
        "status": status,
        "details": details,
        "bounds": [BOX_MIN_X, BOX_MIN_Y, BOX_MAX_X, BOX_MAX_Y],
        "scores": {
            "yaw": round(yaw_ratio, 2),
            "vert": round(vert_ratio, 2)
        }
    }