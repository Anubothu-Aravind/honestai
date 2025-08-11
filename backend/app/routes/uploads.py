from fastapi import APIRouter, File, UploadFile, Depends
from sqlalchemy.orm import Session
from ..auth import get_current_user
from .. import database, models
import os, shutil

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    user=Depends(get_current_user)
):
    user_dir = os.path.join(UPLOAD_DIR, str(user.id))
    os.makedirs(user_dir, exist_ok=True)

    file_path = os.path.join(user_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db_upload = models.FileUpload(
        filename=file.filename,
        filepath=file_path,
        owner_id=user.id
    )
    db.add(db_upload)
    db.commit()
    db.refresh(db_upload)

    return {"filename": file.filename, "path": file_path}
