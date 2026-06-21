from app import create_app
from werkzeug.serving import run_simple

app = create_app()
print('Starting Flask server on port 8080...')
run_simple('0.0.0.0', 8080, app, use_reloader=False)
