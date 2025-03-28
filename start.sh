#!/bin/bash
set -e

# Print debug information
echo "Starting application..."
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo "Files in directory: $(ls -la)"

# Make sure required directories exist
mkdir -p static/css static/js templates
touch static/css/.keep static/js/.keep templates/.keep

# Install dependencies (failsafe)
echo "Installing dependencies..."
pip install -r requirements.txt

# Get PORT from environment or use default
PORT="${PORT:-8080}"
echo "Using PORT: $PORT"

# Start gunicorn with the proper configuration
echo "Starting gunicorn server..."
python -m gunicorn --config gunicorn.conf.py --log-level debug --access-logfile - --error-logfile - wsgi:app
