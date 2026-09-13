@echo off
REM Fresh Squeeze - Local Server Setup & Run (Windows)

echo.
echo =========================================
echo Fresh Squeeze - Setup ^& Run
echo =========================================
echo.

REM Check if models directory exists
if not exist "models" (
    echo Creating models directory...
    mkdir models
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
echo Gameplay Tips:
echo   1. Click 'Turn on my camera'
echo   2. Grab the straw with your hand
echo   3. Bring it to your lips
echo   4. Pucker your lips to sip fresh cold orange juice!
echo   5. Press 'R' to refill the glass
echo.

python -m http.server 8080
