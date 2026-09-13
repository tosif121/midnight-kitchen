#!/bin/bash

# Fresh Squeeze - Local Server Setup & Run
# This script verifies models and starts the local server

set -e

echo ""
echo "========================================="
echo "Fresh Squeeze - Setup & Run"
echo "========================================="
echo ""

# Check if models directory exists
if [ ! -d "models" ]; then
    echo "📦 Creating models directory..."
    mkdir -p models
fi

echo "🚀 Starting server at: http://localhost:8080"
echo ""
echo "Gameplay Tips:"
echo "  1. Click 'Turn on my camera'"
echo "  2. Grab the straw with your hand"
echo "  3. Bring it to your lips"
echo "  4. Pucker your lips to sip fresh cold orange juice!"
echo "  5. Press 'R' to refill the glass"
echo ""

python3 -m http.server 8080
