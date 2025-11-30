import numpy as np

def detect_objects(image: np.ndarray) -> dict:
    import cv2
    # Convert BGR to RGB
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    from ultralytics import YOLO
    model = YOLO("yolov8n.pt")  
    # Run inference
    results = model(rgb_image)

    # Parse results
    detections = []
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            detections.append({
                "label": label,
                "confidence": round(conf, 3),
                "bounding_box": [round(x, 2) for x in xyxy]
            })

    return {
        "object_count": len(detections),
        "detections": [det["label"] for det in detections]
    }