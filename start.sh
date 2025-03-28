#!/bin/bash

# Print python and pip versions for debugging
echo "Python version:"
python --version
echo "Pip version:"
pip --version

# Install dependencies (failsafe in case they weren't installed during build)
pip install -r requirements.txt

# Use full path to gunicorn
echo "Starting gunicorn..."
python -m gunicorn --config gunicorn.conf.py wsgi:app
