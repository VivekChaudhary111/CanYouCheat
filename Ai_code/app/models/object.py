from ultralytics import YOLO  
import numpy as np

# We are interested in these classes from the COCO dataset
# 67: cell phone
# 73: book
TARGET_CLASSES = [67, 73]

class ObjectDetector:
    def __init__(self, model_path: str = 'yolov8n.pt'):
        """
        Loads the YOLOv8 model.
        
        Args:
            model_path (str): Path to the model file. Can be:
                              - 'yolov8n.pt' (will download)
                              - './weights/your_custom_yolov8.pt' (your tuned model)
        """
        try:
            # 1. Load the YOLOv8 model
            self.model = YOLO(model_path)
            
            # 2. Store the class names from the model
            self.class_names = self.model.names
            
        except Exception as e:
            print(f"Error loading YOLOv8 model: {e}")
            print("Please ensure 'ultralytics' is installed and the model path is correct.")
            raise

    def analyze(self, image_rgb: np.ndarray) -> dict:
        """
        Analyzes the image for prohibited objects using YOLOv8.
        """
        flags = {
            "phone_detected": False,
            "book_detected": False,
        }

        # Run inference, filtering for our target classes
        results = self.model(
            image_rgb,
            classes=TARGET_CLASSES,
            conf=0.4,       # You can tune this confidence threshold
            verbose=False   # Suppress console output
        )
        
        # results[0].boxes.cls gives a tensor of detected class IDs
        # e.g., tensor([67., 73.])
        detected_classes = results[0].boxes.cls

        if detected_classes.numel() == 0:
            # No target objects detected
            return flags

        # Check the names of the detected classes
        for c in detected_classes:
            class_name = self.class_names.get(int(c)) # .get() is safer
            
            if class_name == 'cell phone':
                flags["phone_detected"] = True
            elif class_name == 'book':
                flags["book_detected"] = True
            
            # If both are found, no need to keep checking
            if flags["phone_detected"] and flags["book_detected"]:
                break
            
        return flags