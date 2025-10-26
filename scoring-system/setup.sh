#!/bin/bash

echo "🍽️ Setting up Eating Pace Scoring System"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install main package dependencies
echo "📦 Installing main package dependencies..."
cd scoring-system
npm install

if [ $? -eq 0 ]; then
    echo "✅ Main package dependencies installed successfully"
else
    echo "❌ Failed to install main package dependencies"
    exit 1
fi

# Install demo dependencies
echo "📦 Installing demo dependencies..."
cd ../demo
npm install

if [ $? -eq 0 ]; then
    echo "✅ Demo dependencies installed successfully"
else
    echo "❌ Failed to install demo dependencies"
    exit 1
fi

# Run tests
echo "🧪 Running tests..."
cd ../scoring-system
npm test

if [ $? -eq 0 ]; then
    echo "✅ All tests passed"
else
    echo "⚠️ Some tests failed, but continuing..."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To run the demo:"
echo "  cd demo && npm run dev"
echo ""
echo "To run tests:"
echo "  cd scoring-system && npm test"
echo ""
echo "To build the library:"
echo "  cd scoring-system && npm run build"
