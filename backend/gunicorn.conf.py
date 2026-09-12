import multiprocessing
import os


bind = os.environ.get('GUNICORN_BIND', '0.0.0.0:8000')
workers = int(os.environ.get('GUNICORN_WORKERS', max(2, multiprocessing.cpu_count() * 2 + 1)))
timeout = int(os.environ.get('GUNICORN_TIMEOUT', '120'))
graceful_timeout = int(os.environ.get('GUNICORN_GRACEFUL_TIMEOUT', '30'))
accesslog = '-'
errorlog = '-'
capture_output = True
