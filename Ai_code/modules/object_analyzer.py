# modules/object_detector.py

import cv2
from ultralytics import YOLO

class ObjectDetector:
    def __init__(self, model_path='yolov8n.pt'):
        """Initializes the YOLOv8 model."""
        self.model = YOLO(model_path)
        print("ObjectDetector initialized.")

    def detect(self, frame, target_class='cell phone', conf_threshold=0.5):
        """Detects objects in a frame and annotates it."""
        phone_detected = False
        annotated_frame = frame.copy() # Work on a copy to not alter the original

        results = self.model(frame, verbose=False)

        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                class_name = self.model.names[class_id]

                if class_name.lower() == target_class and float(box.conf[0]) > conf_threshold:
                    phone_detected = True
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    # Draw rectangle and label on the copied frame
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    cv2.putText(annotated_frame, "Cell Phone Detected", (x1, y1 - 10), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

        return {"phone_detected": phone_detected, "annotated_frame": annotated_frame}