from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import httpx

from database import get_db, SessionLocal, FlinkJob
from models import FlinkJobResponse

router = APIRouter()

FLINK_REST_URL = "http://localhost:8081"


@router.get("/status")
async def get_flink_status():
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{FLINK_REST_URL}/config", timeout=5.0)
            resp.raise_for_status()
            return {"status": "running", "config": resp.json()}
        except httpx.ConnectError:
            return {"status": "unreachable", "error": "Flink cluster is not running"}
        except httpx.HTTPStatusError as e:
            return {"status": "error", "error": str(e)}
        except Exception as e:
            return {"status": "error", "error": str(e)}


@router.get("/jobs")
async def list_flink_jobs(db: Session = Depends(get_db)):
    db_jobs = db.query(FlinkJob).all()
    result = [FlinkJobResponse.model_validate(j) for j in db_jobs]
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{FLINK_REST_URL}/jobs/overview", timeout=5.0)
            resp.raise_for_status()
            cluster_jobs = resp.json()
            return {"database_jobs": result, "cluster_jobs": cluster_jobs}
        except httpx.ConnectError:
            return {"database_jobs": result, "cluster_jobs": None, "error": "Flink cluster is not running"}
        except Exception as e:
            return {"database_jobs": result, "cluster_jobs": None, "error": str(e)}


@router.post("/submit/stream", response_model=FlinkJobResponse)
async def submit_streaming_job(db: Session = Depends(get_db)):
    job = FlinkJob(
        job_name="sensor_stream_processor",
        job_type="streaming",
        status="pending",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                f"{FLINK_REST_URL}/jobs/upload",
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()
            job.job_id = data.get("jobId", "")
            job.status = "running"
        except Exception:
            job.status = "submitted_locally"

    job.last_check = datetime.now()
    db.commit()
    db.refresh(job)
    return job


@router.post("/submit/batch", response_model=FlinkJobResponse)
async def submit_batch_job(db: Session = Depends(get_db)):
    job = FlinkJob(
        job_name="safety_report_batch",
        job_type="batch",
        status="pending",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                f"{FLINK_REST_URL}/jobs/upload",
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()
            job.job_id = data.get("jobId", "")
            job.status = "running"
        except Exception:
            job.status = "submitted_locally"

    job.last_check = datetime.now()
    db.commit()
    db.refresh(job)
    return job


@router.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str):
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{FLINK_REST_URL}/jobs/{job_id}", timeout=5.0)
            resp.raise_for_status()
            return resp.json()
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Flink cluster is not running")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=str(e))


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.patch(f"{FLINK_REST_URL}/jobs/{job_id}", timeout=5.0)
            resp.raise_for_status()
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Flink cluster is not running")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=str(e))

    db_job = db.query(FlinkJob).filter(FlinkJob.job_id == job_id).first()
    if db_job:
        db_job.status = "canceled"
        db_job.last_check = datetime.now()
        db.commit()
    return {"message": f"Job {job_id} cancel requested"}


@router.get("/checkpoints")
async def get_checkpoints():
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{FLINK_REST_URL}/jobs/overview", timeout=5.0)
            resp.raise_for_status()
            overview = resp.json()
            checkpoints = []
            for j in overview.get("jobs", []):
                job_id = j.get("jid") or j.get("id")
                if job_id:
                    try:
                        cp_resp = await client.get(
                            f"{FLINK_REST_URL}/jobs/{job_id}/checkpoints", timeout=5.0
                        )
                        cp_resp.raise_for_status()
                        checkpoints.append({"job_id": job_id, "checkpoints": cp_resp.json()})
                    except Exception:
                        checkpoints.append({"job_id": job_id, "checkpoints": None})
            return {"checkpoints": checkpoints}
        except httpx.ConnectError:
            return {"checkpoints": None, "error": "Flink cluster is not running"}
        except Exception as e:
            return {"checkpoints": None, "error": str(e)}


@router.get("/overview")
async def get_flink_overview():
    async with httpx.AsyncClient() as client:
        try:
            overview_resp = await client.get(f"{FLINK_REST_URL}/overview", timeout=5.0)
            overview_resp.raise_for_status()
            return overview_resp.json()
        except httpx.ConnectError:
            return {"error": "Flink cluster is not running"}
        except Exception as e:
            return {"error": str(e)}
