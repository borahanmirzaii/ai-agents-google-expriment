#!/bin/bash
# Quick setup script for AI Agent System

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=================================="
echo "AI Agent System - Quick Setup"
echo "=================================="
echo

# Check Python version
echo "Checking Python version..."
PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
echo "Found Python $PYTHON_VERSION"

if [[ ! "$PYTHON_VERSION" =~ ^3\.(11|12) ]]; then
    echo -e "${YELLOW}Warning: Python 3.11+ recommended${NC}"
fi

echo

# Create virtual environment
echo "Creating virtual environment..."
python -m venv venv
echo -e "${GREEN}✓ Virtual environment created${NC}"
echo

# Activate virtual environment
echo "To activate the virtual environment, run:"
echo -e "${GREEN}source venv/bin/activate${NC}"
echo

# Install dependencies
echo "Installing dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please edit .env and set your PROJECT_ID${NC}"
else
    echo ".env file already exists"
fi

echo

# Print next steps
echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo
echo "Next steps:"
echo "1. Activate virtual environment:"
echo "   source venv/bin/activate"
echo
echo "2. Configure environment:"
echo "   Edit .env and set your PROJECT_ID"
echo
echo "3. Authenticate with Google Cloud:"
echo "   gcloud auth application-default login"
echo
echo "4. Run the examples:"
echo "   python examples/simple_agent.py"
echo "   python examples/multi_agent_demo.py"
echo
echo "5. Run tests:"
echo "   pytest tests/ -v"
echo

echo "For more information, see README.md"
