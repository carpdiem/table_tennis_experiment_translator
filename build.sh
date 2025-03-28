#!/bin/bash
# Ensure script fails on errors
set -e

# Install dependencies
pip install -r requirements.txt

# Print installed packages for debugging
pip list
