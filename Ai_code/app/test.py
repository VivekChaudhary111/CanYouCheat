import cv2
import requests
import numpy as np
import time

# Configuration
API_URL = "http://127.0.0.1:8000/proctor"
CAM_INDEX = 0  # 0 is usually the default webcam

def draw_results(frame, data):
    """
    Parses the API response and draws overlays on the frame.
    """
    analysis = data.get("data", {})
    status = data.get("status", "Unknown")
    
    # 1. Draw Overall Status
    color = (0, 255, 0) # Green
    if "FLAG" in status:
        color = (0, 0, 255) # Red
    
    cv2.putText(frame, f"STATUS: {status}", (10, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

    # 2. Draw Face Count
    face_count = analysis.get("face_count", 0)
    face_text = f"Faces: {face_count}"
    cv2.putText(frame, face_text, (10, 60), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

    # 3. Draw Gaze Analysis
    gaze = analysis.get("gaze_analysis", {})
    gaze_status = gaze.get("details", "N/A")
    cv2.putText(frame, f"Gaze: {gaze_status}", (10, 90), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 100, 0), 2)

    # 4. Draw Detected Objects
    objects = analysis.get("object_detection", {})
    det_list = objects.get("detections", [])
    if det_list:
        obj_text = f"Objects: {', '.join(det_list)}"
        cv2.putText(frame, obj_text, (10, 120), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

    return frame

def start_test():
    print(f"Connecting to Camera {CAM_INDEX}...")
    cap = cv2.VideoCapture(CAM_INDEX)
    
    # Set resolution (optional, helps with speed)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    if not cap.isOpened():
        print("Error: Could not open camera.")
        return

    print("Starting Loop. Press 'q' to quit.")
    
    # Frame skipping to emulate real-world network latency (don't spam server)
    frame_count = 0
    SKIP_FRAMES = 5  # Process every 5th frame
    
    last_data = {} # Store last valid response to keep drawing it

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        
        # Only send request occasionally to keep UI smooth
        if frame_count % SKIP_FRAMES == 0:
            try:
                # Encode frame as JPEG
                _, img_encoded = cv2.imencode('.jpg', frame)
                image_bytes = img_encoded.tobytes()

                # Send POST request to your API
                response = requests.post(
                    API_URL,
                    files={"file": ("frame.jpg", image_bytes, "image/jpeg")}
                )
                
                if response.status_code == 200:
                    last_data = response.json()
                    # Print to console for debugging
                    print(f"API Response: {last_data['status']}")
                else:
                    print(f"Server Error: {response.status_code}")

            except requests.exceptions.ConnectionError:
                print("Cannot connect to server. Is main.py running?")
            except Exception as e:
                print(f"Error: {e}")

        # Draw the last known results on the current frame
        if last_data:
            frame = draw_results(frame, last_data)

        cv2.imshow('AI Proctor Test (Press q to quit)', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    start_test()