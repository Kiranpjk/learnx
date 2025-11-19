from .models import Course

def run():
    data = [
        {
            "title": "Python for Beginners",
            "description": "Learn Python from scratch.",
            "image": "https://source.unsplash.com/random/300x200?python"
        },
        {
            "title": "Frontend Crash Course",
            "description": "Master React + Tailwind.",
            "image": "https://source.unsplash.com/random/300x200?react"
        },
        {
            "title": "Django REST Framework",
            "description": "Build modern APIs.",
            "image": "https://source.unsplash.com/random/300x200?django"
        }
    ]

    for c in data:
        Course.objects.create(**c)

    print("Dummy courses added!")
