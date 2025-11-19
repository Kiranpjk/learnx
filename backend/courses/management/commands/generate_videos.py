from django.core.management.base import BaseCommand
from django.conf import settings
from courses.models import Course, Lesson
from ai.video_utils import generate_short_video


class Command(BaseCommand):
    help = "Generate short videos for courses (trailers) and lessons that are missing videos."

    def add_arguments(self, parser):
        parser.add_argument("--seconds", type=int, default=8, help="Length of each video in seconds")
        parser.add_argument("--force", action="store_true", help="Regenerate even if video exists")

    def handle(self, *args, **options):
        secs = max(3, int(options["seconds"]))
        force = bool(options["force"])        
        updated_courses = 0
        updated_lessons = 0

        # Courses
        for c in Course.objects.all():
            if force or not c.trailer_video_url:
                desc = (c.description or "").strip().split(".")[0]
                text = f"{c.title}\n{desc[:200]}"
                url, err = generate_short_video(text, subfolder="courses", filename_prefix=f"course_{c.id}", seconds=secs)
                if url:
                    c.trailer_video_url = url
                    c.save(update_fields=["trailer_video_url"])
                    updated_courses += 1
                    self.stdout.write(self.style.SUCCESS(f"Course {c.id}: OK"))
                else:
                    self.stdout.write(self.style.WARNING(f"Course {c.id}: FAILED {err}"))

        # Lessons
        for l in Lesson.objects.all():
            if force or not l.video_url:
                transcript = (l.transcript or "").strip()
                first_para = transcript.split("\n\n")[0] if transcript else ""
                text = f"{l.title}\n{first_para[:220]}" if first_para else l.title
                url, err = generate_short_video(text, subfolder="lessons", filename_prefix=f"lesson_{l.id}", seconds=secs)
                if url:
                    l.video_url = url
                    l.save(update_fields=["video_url"])
                    updated_lessons += 1
                    self.stdout.write(self.style.SUCCESS(f"Lesson {l.id}: OK"))
                else:
                    self.stdout.write(self.style.WARNING(f"Lesson {l.id}: FAILED {err}"))

        self.stdout.write(self.style.SUCCESS(f"Updated courses: {updated_courses}, lessons: {updated_lessons}"))
from django.core.management.base import BaseCommand
from django.conf import settings
from ai.video_utils import generate_short_video
from courses.models import Course, Lesson


class Command(BaseCommand):
    help = "Generate short videos for courses (trailers) and lessons if missing."

    def add_arguments(self, parser):
        parser.add_argument("--seconds", type=int, default=8, help="Duration of each video")
        parser.add_argument("--courses", action="store_true", help="Generate course trailers")
        parser.add_argument("--lessons", action="store_true", help="Generate lesson videos")

    def handle(self, *args, **options):
        seconds = options["seconds"]
        do_courses = options["courses"]
        do_lessons = options["lessons"]
        if not do_courses and not do_lessons:
            do_courses = do_lessons = True

        updated_courses = 0
        updated_lessons = 0

        if do_courses:
            for c in Course.objects.all():
                if not c.trailer_video_url:
                    desc = (c.description or "").strip().split(".")[0]
                    text = f"{c.title}\n{desc[:200]}"
                    url, err = generate_short_video(text, subfolder="courses", filename_prefix=f"course_{c.id}", seconds=seconds)
                    if url:
                        c.trailer_video_url = url
                        c.save(update_fields=["trailer_video_url"])
                        updated_courses += 1
                        self.stdout.write(self.style.SUCCESS(f"Course {c.id}: video -> {url}"))
                    else:
                        self.stdout.write(self.style.WARNING(f"Course {c.id}: failed ({err})"))

        if do_lessons:
            for l in Lesson.objects.all():
                if not l.video_url:
                    transcript = (l.transcript or "").strip()
                    first_para = transcript.split("\n\n")[0] if transcript else ""
                    text = f"{l.title}\n{first_para[:220]}" if first_para else l.title
                    url, err = generate_short_video(text, subfolder="lessons", filename_prefix=f"lesson_{l.id}", seconds=seconds)
                    if url:
                        l.video_url = url
                        l.save(update_fields=["video_url"])
                        updated_lessons += 1
                        self.stdout.write(self.style.SUCCESS(f"Lesson {l.id}: video -> {url}"))
                    else:
                        self.stdout.write(self.style.WARNING(f"Lesson {l.id}: failed ({err})"))

        self.stdout.write(self.style.SUCCESS(f"Done. Courses: {updated_courses}, Lessons: {updated_lessons}"))
