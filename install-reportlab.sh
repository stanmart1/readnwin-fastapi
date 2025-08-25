#!/bin/bash

# Install ReportLab for PDF generation
echo "Installing ReportLab for PDF generation..."

cd readnwin-backend

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
elif [ -d ".venv" ]; then
    echo "Activating virtual environment..."
    source .venv/bin/activate
fi

# Install ReportLab
pip install reportlab==4.0.7

echo "ReportLab installation completed!"
echo "You can now generate PDF receipts and invoices."