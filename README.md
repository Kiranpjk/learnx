Modern Learning Platform (Production-ready scaffold)

Structure:
- backend/  -> Django REST API with Django auth, models, forms (users, courses, quizzes, ai)
- frontend/ -> React + Vite + Tailwind modern UI

Quick start:
- Backend:
  cd backend
  python -m venv venv
  venv\Scripts\activate (Windows) OR source venv/bin/activate (mac/linux)
  pip install -r requirements.txt
  python manage.py makemigrations
  python manage.py migrate
  python manage.py createsuperuser
  python manage.py runserver

- Frontend:
  cd frontend
  npm install
  npm run dev

This scaffold was generated as a polished starting point by an expert-level engineer.
"# learnx" 
