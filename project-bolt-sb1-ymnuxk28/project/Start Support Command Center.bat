@echo off
title Support Command Center
echo.
echo  Starting Support Command Center...
echo.

REM Check if Node.js is available
where node >nul 2>nul
if errorlevel 1 (
  echo  ERROR: Node.js was not found on this system.
  echo  Please install Node.js from https://nodejs.org/ and try again.
  echo.
  pause
  exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
  echo  Installing dependencies (first run only)...
  call npm install
  if errorlevel 1 (
    echo  ERROR: Failed to install dependencies.
    echo.
    pause
    exit /b 1
  )
)

REM Always rebuild so the served files stay current
echo  Building the application...
call npm run build
if errorlevel 1 (
  echo  ERROR: Failed to build the application.
  echo.
  pause
  exit /b 1
)

REM Start the local server
echo.
echo  Starting local server at http://localhost:3001
echo  Keep this window open and open that URL in your browser.
echo.
node server.cjs

pause
