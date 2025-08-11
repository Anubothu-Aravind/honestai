from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..auth import get_current_user
from .. import database, models
from ..utils.audio import speech_to_text, analyze_truthfulness
from ..utils.vision import detect_faces
import os

router = APIRouter()

@router.get("/")
async def run_analysis(
    filename: str = Query(...),
    db: Session = Depends(database.get_db),
    user=Depends(get_current_user)
):
    # Get file record
    file_record = db.query(models.FileUpload).filter_by(
        filename=filename, owner_id=user.id
    ).first()
    if not file_record or not os.path.exists(file_record.filepath):
        return {"error": "File not found"}

    # Step 1 — Speech to text
    transcript = speech_to_text(file_record.filepath)

    # Step 2 — Truth analysis
    truth_score = analyze_truthfulness(transcript)

    # Step 3 — Face detection if video
    faces_count = detect_faces(file_record.filepath) if filename.lower().endswith((".mp4", ".mov")) else None

    # Store result
    result = models.AnalysisResult(
        transcript=transcript,
        truth_score=truth_score,
        faces_detected=faces_count,
        file_id=file_record.id,
        owner_id=user.id
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    return {
        "speech_to_text": transcript,
        "truth_score": truth_score,
        "faces_detected": faces_count
    }

@router.get("/history")
async def get_analysis_history(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=50, description="Max records to return"),
    sort: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(database.get_db),
    user=Depends(get_current_user)
):
    query = db.query(models.AnalysisResult).filter_by(owner_id=user.id)

    if sort == "desc":
        query = query.order_by(models.AnalysisResult.analyzed_at.desc())
    else:
        query = query.order_by(models.AnalysisResult.analyzed_at.asc())

    history = query.offset(skip).limit(limit).all()

    return [
        {
            "id": r.id,
            "transcript": r.transcript,
            "truth_score": r.truth_score,
            "faces_detected": r.faces_detected,
            "analyzed_at": r.analyzed_at.isoformat()
        }
        for r in history
    ]

@router.get("/{analysis_id}")
async def get_analysis_detail(
    analysis_id: int,
    db: Session = Depends(database.get_db),
    user=Depends(get_current_user)
):
    result = db.query(models.AnalysisResult).filter_by(
        id=analysis_id, owner_id=user.id
    ).first()

    if not result:
        return {"error": "Analysis not found"}

    return {
        "id": result.id,
        "transcript": result.transcript,
        "truth_score": result.truth_score,
        "faces_detected": result.faces_detected,
        "analyzed_at": result.analyzed_at.isoformat()
    }
