from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.database import Base, engine
from app.routers import (
    auth,
    subjects,
    timetable,
    study_planner,
    tasks,
    exams,
    dsa,
    pomodoro,
    analytics,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize relational database tables if they do not exist (preserves all existing records)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="CSE Study Planner API",
    description=(
        "Complete REST API for the CSE Study Planner web application: "
        "Authentication, Subjects & Syllabus, College & Personal Weekly Timetable, "
        "Conflict Detection, Rule-Based Study Schedule Generator, Study Planner, "
        "Tasks & Assignments, Examination Timetable, DSA Practice Tracker, "
        "Pomodoro Focus Timer, and Real-Time Analytics."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

allowed_origins = [
    settings.FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "CSE Study Planner API",
        "environment": settings.APP_ENV,
    }


app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(timetable.router)
app.include_router(study_planner.router)
app.include_router(tasks.router)
app.include_router(exams.router)
app.include_router(dsa.router)
app.include_router(pomodoro.router)
app.include_router(analytics.router)
