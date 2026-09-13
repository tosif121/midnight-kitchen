@echo off
REM The Midnight Kitchen - Local Server Setup & Test (Windows)
REM This script downloads the MediaPipe model and starts the local server

echo.
echo =========================================
echo The Midnight Kitchen - Setup ^& Run
echo =========================================
echo.

REM Check if models directory exists
if not exist "models" (
    echo Creating models directory...
    mkdir models
)

REM Check if hand_landmarker.task exists
if not exist "models\hand_landmarker.task" (
    echo Downloading MediaPipe hand_landmarker.task (^~23 MB)...
    echo (This may take 1-2 minutes depending on your connection)
    echo.
    powershell -Command "Invoke-WebRequest -Uri 'https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task' -OutFile 'models/hand_landmarker.task'"
    echo.
    echo Model downloaded successfully
) else (
    echo Model already downloaded (models/hand_landmarker.task)
)

echo.
echo =========================================
echo Starting Local Server...
echo =========================================
echo.
echo Server running at: http://localhost:8080
echo.
echo Open your browser and navigate to the URL above.
echo.
echo Press Ctrl+C to stop the server.
echo.
echo Gameplay Tips:
echo   1. Click 'Open the kitchen'
echo   2. Allow camera access
echo   3. Hold your open palm over the pot (bottom-center)
echo   4. Wait 400ms for hand detection
echo   5. The meter will fill as you hold steady
echo   6. Move your hand up to release the steam
echo   7. Repeat 5 times to unlock Midnight Specials
echo.

python -m http.server 8080
