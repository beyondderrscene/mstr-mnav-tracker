# backend/main.py
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
from data import get_mnav
from llm import generate_summary

app = FastAPI()

# Allow the React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "message": "MSTR mNAV API is running"}

@app.get("/api/mnav")
def mnav_endpoint(
    start: str = Query(default="2020-08-11"),
    end: str = Query(default=str(date.today())),
):
    df = get_mnav(start=start, end=end)
    df.index = df.index.strftime("%Y-%m-%d")  # convert dates to strings for JSON
    return df.reset_index().rename(columns={"index": "date"}).to_dict(orient="records")

@app.get("/api/summary")
def summary_endpoint(
    start: str = Query(default="2020-08-11"),
    end: str = Query(default=str(date.today())),
):
    df = get_mnav(start=start, end=end)
    summary = generate_summary(df)
    return {"summary": summary}