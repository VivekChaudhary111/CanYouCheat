
def verify_faces(img1_path: str, img2_path: str) -> dict:
    from deepface import DeepFace
    result = DeepFace.verify(
        img1_path=img1_path,
        img2_path=img2_path,
        model_name="Facenet",              
        detector_backend="mtcnn",
        distance_metric="cosine",
        enforce_detection=True
    )
    return {
        "model": result["model"],
        "verified": result["verified"],
        "threshold": result["threshold"],
        "distance": result["distance"],
        "similarity_metric": result["similarity_metric"]
    }