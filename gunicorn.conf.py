# Gunicorn configuration file
import multiprocessing
import os

# Binding
bind = "0.0.0.0:" + os.environ.get("PORT", "8080")  # Use environment PORT or default to 8080

# Worker Processes
workers = 2  # Simplified for Digital Ocean App Platform
worker_class = 'sync'
threads = 2

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'

# Timeout
timeout = 60
keepalive = 5

# Security
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190
