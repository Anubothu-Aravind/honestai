from fastapi import FastAPI
from . import models, database
from .routes import auth, uploads, analysis
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="HonestAI Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
app.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
