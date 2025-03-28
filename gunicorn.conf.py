# Gunicorn configuration file
import multiprocessing

# Binding
bind = "0.0.0.0:8080"  # DigitalOcean App Platform expects port 8080

# Worker Processes
workers = multiprocessing.cpu_count() * 2 + 1
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
