from django.core.management.base import BaseCommand
from courses.models import Course, Lesson


class Command(BaseCommand):
    help = "Create additional demo course and lessons if missing (ensures /api/courses/2 and lessons >=4 exist)."

    def handle(self, *args, **options):
        # Ensure at least two courses
        if not Course.objects.filter(id=2).exists():
            c2 = Course.objects.create(
                title="Backend APIs with Django REST",
                description="Learn to build RESTful APIs with Django REST Framework."
                            " Authentication, permissions, serializers, viewsets, and more.",
                instructor="AI Instructor",
                category="Programming",
                level="beginner",
                language="English",
                price=0,
                tags="django,rest,api",
            )
            # Create 3 lessons (ids will continue from existing, e.g., 4,5,6)
            titles = ["Intro to DRF", "Serializers & Views", "Auth & Permissions"]
            for i, t in enumerate(titles, start=1):
                Lesson.objects.create(course=c2, title=t, order=i,
                                      content=f"Content for {t}",
                                      transcript=f"Transcript for {t}")
            self.stdout.write(self.style.SUCCESS("Created demo course id=2 with 3 lessons."))
        else:
            self.stdout.write("Course id=2 already exists. Skipping.")
        self.stdout.write(self.style.SUCCESS("Done."))
