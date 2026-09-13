#!/bin/bash

# The Midnight Kitchen - Local Server Setup & Test
# This script downloads the MediaPipe model and starts the local server

set -e

echo ""
echo "========================================="
echo "The Midnight Kitchen - Setup & Run"
echo "========================================="
echo ""

# Check if models directory exists
if [ ! -d "models" ]; then
    echo "📦 Creating models directory..."
    mkdir -p models
fi

# Check if hand_landmarker.task exists
if [ ! -f "models/hand_landmarker.task" ]; then
    echo "📥 Downloading MediaPipe hand_landmarker.task (~23 MB)..."
    echo "   (This may take 1-2 minutes depending on your connection)"
    echo ""
    curl -L -o models/hand_landmarker.task \
        https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task
    echo ""
    echo "✅ Model downloaded successfully"
else
    echo "✅ Model already downloaded (models/hand_landmarker.task)"
fi

echo ""
echo "========================================="
echo "Starting Local Server..."
echo "========================================="
echo ""
echo "🚀 Server running at: http://localhost:8080"
echo ""
echo "Open your browser and navigate to the URL above."
echo ""
echo "Press Ctrl+C to stop the server."
echo ""
echo "Gameplay Tips:"
echo "  1. Click 'Open the kitchen'"
echo "  2. Allow camera access"
echo "  3. Hold your open palm over the pot (bottom-center)"
echo "  4. Wait 400ms for hand detection"
echo "  5. The meter will fill as you hold steady"
echo "  6. Move your hand up to release the steam"
echo "  7. Repeat 5 times to unlock Midnight Specials"
echo ""

python3 -m http.server 8080
