@echo off
REM Launch Orbit backend (FastAPI) and frontend (Next.js) in separate windows

start "Orbit Backend" cmd /k "cd /d %~dp0backend && .venv\Scripts\uvicorn app.main:app --reload"
start "Orbit Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Waiting for servers to start...
timeout /t 10 /nobreak >nul

start http://localhost:3000
start http://localhost:8000/docs
