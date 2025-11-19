import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from quizzes.models import Quiz, Question, Choice
from courses.models import Course
from django.db import connection

def inspect_table():
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(quizzes_quiz)")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"Columns in quizzes_quiz: {columns}")

def create_quiz():
    inspect_table()
    
    # Get or create a course
    course, _ = Course.objects.get_or_create(
        title="Django for Beginners",
        defaults={
            "description": "A complete guide to Django.",
            "price": 0,
            "level": "Beginner"
        }
    )

    # Clean up old quiz if exists (to ensure questions are added)
    Quiz.objects.filter(title="Django Basics").delete()

    quiz, created = Quiz.objects.get_or_create(
        title="Django Basics",
        course=course,
        defaults={
            "description": "Test your knowledge of Django fundamentals.",
            "time_limit_minutes": 15
        }
    )

    if created:
        print(f"Created quiz: {quiz.title}")
        
        # Q1
        q1 = Question.objects.create(quiz=quiz, text="What is Django?")
        Choice.objects.create(question=q1, text="A web framework", is_correct=True)
        Choice.objects.create(question=q1, text="A database", is_correct=False)
        Choice.objects.create(question=q1, text="A programming language", is_correct=False)
        
        # Q2
        q2 = Question.objects.create(quiz=quiz, text="Which file is used for URL routing?")
        Choice.objects.create(question=q2, text="models.py", is_correct=False)
        Choice.objects.create(question=q2, text="views.py", is_correct=False)
        Choice.objects.create(question=q2, text="urls.py", is_correct=True)
        
        print("Added questions.")
    else:
        print("Quiz already exists.")

if __name__ == "__main__":
    create_quiz()
