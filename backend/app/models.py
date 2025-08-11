from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    uploads = relationship("FileUpload", back_populates="owner")
    analyses = relationship("AnalysisResult", back_populates="owner")

class FileUpload(Base):
    __tablename__ = "uploads"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="uploads")

class AnalysisResult(Base):
    __tablename__ = "analyses"
    id = Column(Integer, primary_key=True, index=True)
    transcript = Column(String)
    truth_score = Column(Float)
    faces_detected = Column(Integer)
    analyzed_at = Column(DateTime, default=datetime.utcnow)
    file_id = Column(Integer, ForeignKey("uploads.id"))
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="analyses")
