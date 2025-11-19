@echo off
setlocal
cd /d %~dp0
if not exist ".venv\Scripts\python.exe" (
  echo Python venv not found. Creating one...
  py -m venv .venv 2>nul || python -m venv .venv
)
".venv\Scripts\python.exe" manage.py runserver
