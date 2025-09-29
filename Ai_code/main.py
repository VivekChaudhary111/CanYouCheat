import cv2
import asyncio
import websockets
import json
import base64
import traceback # Import the traceback module
from modules.face_analyzer import FaceAnalyzer
from modules.object_analyzer import ObjectDetector

# --- Global Initializations ---
face_analyzer = FaceAnalyzer()
object_detector = ObjectDetector()

async def process_frames(websocket, path):
    print("Client connected.")
    video_capture = cv2.VideoCapture(0)
    if not video_capture.isOpened():
        print("Error: Cannot open webcam.")
        return

    try:
        while True:
            # --- ADDED A TRY...EXCEPT BLOCK HERE ---
            try:
                ret, frame = video_capture.read()
                if not ret:
                    print("Could not read frame from webcam. Exiting.")
                    break

                img_h, img_w, _ = frame.shape
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                # 1. Perform Object Detection
                detection_data = object_detector.detect(frame)
                annotated_frame = detection_data["annotated_frame"]
                
                # 2. Perform Face and Pose Analysis
                face_data = face_analyzer.analyze(frame_rgb, img_w, img_h)

                # 3. Prepare Data Packet
                _, buffer = cv2.imencode('.jpg', annotated_frame)
                jpg_as_text = base64.b64encode(buffer).decode('utf-8')

                response_data = json.dumps({
                    "image": "data:image/jpeg;base64," + jpg_as_text,
                    "faceCount": face_data["face_count"],
                    "headPose": face_data["head_pose"],
                    "phoneDetected": detection_data["phone_detected"]
                })

                await websocket.send(response_data)
                await asyncio.sleep(0.03)

            # This will now catch any error during processing and print it
            except Exception as e:
                print("💥 An error occurred during frame processing!")
                print(f"Error Type: {type(e).__name__}")
                print(f"Error Details: {e}")
                traceback.print_exc() # Prints the full error traceback
                break # Stop the loop on error

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected.")
    finally:
        video_capture.release()
        print("Webcam released.")

async def main():
    async with websockets.serve(process_frames, "localhost", 8765):
        print("WebSocket server started on ws://localhost:8765")
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Server stopped by user.")
    finally:
        face_analyzer.close()