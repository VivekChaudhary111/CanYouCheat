# ==========================================================================================
# Gaze Estimation Test Script
#
# Description:
# This script uses a pre-trained L2CS-Net model to perform gaze estimation on a live
# webcam feed. It detects a face, predicts the gaze direction (pitch and yaw),
# and visualizes the result with a vector.
#
# Required Files in the same directory:
# 1. test.py (this script)
# 2. l2cs_model.py (the model's architecture file)
# 3. L2CSNet_gaze360.pkl (the pre-trained model weights)
# ==========================================================================================

import cv2
import numpy as np
import torch
import torchvision.transforms as transforms
from PIL import Image

# Import the model's architecture definition
from l2cs_model import L2CS
from torchvision.models.resnet import Bottleneck

def load_model(weights_path):
    """Loads the pre-trained L2CS-Net model."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Define the ResNet-50 architecture
    model = L2CS(
        block=Bottleneck,
        layers=[3, 4, 6, 3],
        num_bins=90  # The original L2CS model was trained with 90 bins
    )
    
    print(f"Loading model weights from: {weights_path}")
    saved_state_dict = torch.load(weights_path, map_location=device)
    
    # Handle models saved with 'module.' prefix (from DataParallel training)
    if 'module.' in list(saved_state_dict.keys())[0]:
        new_state_dict = {k.replace('module.', ''): v for k, v in saved_state_dict.items()}
    else:
        new_state_dict = saved_state_dict
        
    model.load_state_dict(new_state_dict)
    model.to(device)
    model.eval()
    print("Model loaded successfully and set to evaluation mode.")
    return model, device

def preprocess_image(img):
    """Prepares the image for the model."""
    transform = transforms.Compose([
        transforms.Resize(224),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    return transform(img)

def post_process_gaze(gaze_output, device):
    """Converts the model's raw output tensor into a single angle in radians."""
    softmax = torch.nn.Softmax(dim=1)
    probabilities = softmax(gaze_output)

    # Create a tensor of bin indices [0, 1, 2, ..., 89]
    bins = torch.arange(90).to(device)

    # Calculate the weighted average (expected value) of the bins
    expected_value = torch.sum(bins * probabilities.squeeze(), dim=0)

    # Convert the average bin index to an angle in degrees.
    # The model maps 90 bins to the range [-90, 90] degrees.
    angle_degrees = (expected_value * 2) - 90

    # Convert degrees to radians for the draw_gaze function
    angle_radians = angle_degrees * (np.pi / 180.0)
    
    return angle_radians.item()

def draw_gaze(image, face_center, pitch, yaw, length=150, color=(0, 255, 0)):
    """Draws the gaze vector on the image."""
    # Yaw is rotation around the Y-axis (left-right)
    # Pitch is rotation around the X-axis (up-down)
    dx = -length * np.sin(yaw) * np.cos(pitch)
    dy = -length * np.sin(pitch)
    
    end_point = (int(face_center[0] + dx), int(face_center[1] + dy))
    
    # Draw an arrowed line from the center of the face
    cv2.arrowedLine(image, face_center, end_point, color, 2, cv2.LINE_AA)

def main():
    # --- IMPORTANT: Set the path to your model weights file ---
    MODEL_WEIGHTS = "Ai_code\L2CSNet_gaze360.pkl"
    
    # Load face detector (Haar Cascade)
    face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    # Load gaze estimation model
    try:
        gaze_model, device = load_model(MODEL_WEIGHTS)
    except FileNotFoundError:
        print(f"Error: Model weights file not found at '{MODEL_WEIGHTS}'.")
        print("Please make sure the file is in the same directory as the script.")
        return
    except Exception as e:
        print(f"An error occurred while loading the model: {e}")
        return

    # Start webcam
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    print("\nWebcam feed started. Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Flip the frame horizontally for a mirror-like view
        frame = cv2.flip(frame, 1)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_detector.detectMultiScale(gray, 1.1, 4)

        # Process the first detected face
        if len(faces) > 0:
            x, y, w, h = faces[0]
            
            # Draw a rectangle around the face
            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
            
            # Crop the face for gaze estimation
            face_img_bgr = frame[y:y+h, x:x+w]
            
            # Convert BGR (OpenCV) to RGB (PIL)
            face_img_rgb = cv2.cvtColor(face_img_bgr, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(face_img_rgb)
            
            # Preprocess image and get prediction
            processed_face = preprocess_image(pil_img).unsqueeze(0).to(device)
            with torch.no_grad():
                raw_yaw, raw_pitch = gaze_model(processed_face)

            # Post-process the raw outputs to get the final angles in radians
            pitch_rad = post_process_gaze(raw_pitch, device)
            yaw_rad = post_process_gaze(raw_yaw, device)
            
            # Draw the gaze vector on the frame
            face_center = (x + w // 2, y + h // 2)
            draw_gaze(frame, face_center, pitch_rad, yaw_rad)

        # Display the resulting frame
        cv2.imshow('Gaze Estimation - Press Q to Quit', frame)

        # Exit on 'q' key press
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    print("Webcam feed stopped.")

if __name__ == '__main__':
    main()