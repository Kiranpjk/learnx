Modern Learning Platform - Backend

Quickstart (Windows, PowerShell)

1) Create and activate virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2) Install dependencies

```powershell
pip install -r requirements.txt
```

3) Environment variables

Create a `.env` file in this `backend` folder (already present in this repo). Minimum:

```
DJANGO_SECRET_KEY=dev-secret-change-me
DEBUG=True
# Optional for AI features
OPENAI_API_KEY=sk-...
# Optional model override
# OPENAI_MODEL=gpt-4o-mini
```

4) Apply migrations and create admin

```powershell
python manage.py migrate
python manage.py createsuperuser
```

5) Run the development server

```powershell
python manage.py runserver
```

Server will be available at http://127.0.0.1:8000/

Admin: http://127.0.0.1:8000/admin/

REST endpoints of interest

- POST /api/ai/ask/  with body `{ "question": "..." }`
- POST /api/ai/generate-lesson/ with body `{ "topic": "..." }`

Example test (PowerShell, form-encoded):

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/ai/ask/ -Method Post -Body @{question='Explain Python decorators'}
```

If PowerShell activation opens Notepad or is blocked
- Make sure you are in a PowerShell terminal (not CMD). In VS Code, click the dropdown next to the plus in the terminal and choose PowerShell.
- Use the correct path and spelling: `.& .\.venv\Scripts\Activate.ps1` (note: Scripts and Activate capitalization does not matter on Windows, but spelling must be exact).
- You can avoid activation entirely by calling the venv python directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py runserver
```

Alternatively, double-click helpers (Windows):
- `backend\setup_backend.bat` – create venv (if needed), install deps, migrate
- `backend\runserver.bat` – start the server using the venv Python

Notes
- CORS is enabled for development and JWT auth is configured.
- AI endpoints gracefully fall back if `OPENAI_API_KEY` is not set.
- For production, use a real WSGI/ASGI server and secure secrets.
