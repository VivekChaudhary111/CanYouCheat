import numpy as np


def count_faces(image: np.ndarray) -> dict:
    import cv2
    # Convert to RGB if needed
    if image.shape[2] == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    from mtcnn import MTCNN
    detector = MTCNN()
    detections = detector.detect_faces(image)
    face_count = len(detections)

    # Optionally return bounding boxes
    boxes = [d["box"] for d in detections]

    return {
        "face_count": face_count,
        "bounding_boxes": boxes
    }