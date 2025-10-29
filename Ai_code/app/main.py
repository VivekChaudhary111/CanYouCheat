from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from app.models.face_verifier import verify_faces
from app.models.face_counter import count_faces
from app.models.object_detector import detect_objects
import base64, uuid, os, cv2, numpy as np

app = FastAPI()

class FacePayload(BaseModel):
    img1_base64: str
    img2_base64: str

def save_base64_image(base64_str: str, filename: str) -> str:
    os.makedirs("images", exist_ok=True)
    img_data = base64.b64decode(base64_str.split(",")[-1])
    path = os.path.join("images", filename)
    with open(path, "wb") as f:
        f.write(img_data)
    return path

@app.post("/verify_faces/")
async def verify_faces_base64(payload: FacePayload):
    img1_path = save_base64_image(payload.img1_base64, f"{uuid.uuid4()}_img1.jpg")
    img2_path = save_base64_image(payload.img2_base64, f"{uuid.uuid4()}_img2.jpg")
    result = verify_faces(img1_path, img2_path)
    os.remove(img1_path)
    os.remove(img2_path)
    return result

@app.post("/proctor")
async def proctor_route(file: UploadFile = File(...)):
    image_bytes = await file.read()
    np_img = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    face_result = count_faces(frame)
    object_result = detect_objects(frame)

    return {
        "face_count": face_result,
        "object_detection": object_result
    }
