@echo off
title CSE Study Planner - Backend Server
color 0A
echo =====================================================
echo   CSE Study Planner - Backend API Server (Port 5000)
echo =====================================================
echo.
cd /d "%~dp0backend"
echo Starting Node.js + Express backend...
echo.
node server.js
pause
