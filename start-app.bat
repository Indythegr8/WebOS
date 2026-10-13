@echo off
setlocal
title WebOS Launcher
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
	echo Node.js was not found on PATH.
	echo Install Node.js 20.19 or newer, then run this file again.
	pause
	exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
	echo npm was not found on PATH.
	echo Reinstall Node.js or add its folder to PATH, then run this file again.
	pause
	exit /b 1
)

if not exist "node_modules\vite\package.json" (
	echo First run detected. Installing project dependencies...
	call npm install
	if errorlevel 1 (
		echo Dependency installation failed. Check your internet connection.
		pause
		exit /b 1
	)
)

echo Building WebOS...
call npm run build
if errorlevel 1 (
	echo The production build failed. Review the output above.
	pause
	exit /b 1
)

echo Starting WebOS at http://localhost:5173/
start "WebOS Dev Server" /D "%~dp0" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173/"