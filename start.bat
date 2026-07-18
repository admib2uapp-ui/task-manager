@echo off
setlocal

REM Launch Orbit backend (FastAPI) and frontend (Next.js) in separate windows.
set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "VENV_PYTHON=%BACKEND%\.venv\Scripts\python.exe"
set "ALEMBIC=%BACKEND%\.venv\Scripts\alembic.exe"

if not exist "%VENV_PYTHON%" (
	echo Backend virtual environment not found at "%VENV_PYTHON%".
	echo Create it first with:
	echo   cd /d "%BACKEND%"
	echo   python -m venv .venv
	echo   .venv\Scripts\python -m pip install -r requirements-dev.txt
	exit /b 1
)

if not exist "%FRONTEND%\package.json" (
	echo Frontend package.json not found at "%FRONTEND%".
	exit /b 1
)

if not exist "%FRONTEND%\node_modules" (
	echo Frontend dependencies are missing. Run "npm install" in "%FRONTEND%" first.
	exit /b 1
)

echo Applying backend migrations...
pushd "%BACKEND%"
call "%ALEMBIC%" upgrade head
if errorlevel 1 (
	popd
	echo Backend migrations failed.
	exit /b 1
)
popd

start "Orbit Backend" cmd /k "cd /d ""%BACKEND%"" && .venv\Scripts\python -m uvicorn app.main:app --reload"
start "Orbit Frontend" cmd /k "cd /d ""%FRONTEND%"" && npm run dev"

echo Waiting for servers to start...
timeout /t 10 /nobreak >nul

start http://localhost:3000
start http://localhost:8000/docs
