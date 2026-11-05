@echo off
title CSE Study Planner - Frontend Dev Server (Port 5173)
color 0B
echo =====================================================
echo   CSE Study Planner - React Frontend (Port 5173)
echo =====================================================
echo.
cd /d "%~dp0frontend"
echo Starting Vite React development server...
echo.
echo Open browser at: http://localhost:5173
echo.
npx vite
pause
