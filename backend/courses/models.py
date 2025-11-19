from django.db import models
from django.contrib.auth.models import User

class Course(models.Model):
    LEVEL_CHOICES = (
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
    )

    title = models.CharField(max_length=200)
    description = models.TextField()
    instructor = models.CharField(max_length=100, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default="beginner")
    language = models.CharField(max_length=50, blank=True, default="English")
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    rating_avg = models.FloatField(default=0)
    rating_count = models.PositiveIntegerField(default=0)
    tags = models.CharField(max_length=255, blank=True, default="")  # comma-separated
    trailer_video_url = models.URLField(blank=True, null=True)
    thumbnail = models.URLField(blank=True, null=True)
    type = models.CharField(max_length=20, default="recorded", choices=[("recorded", "Recorded"), ("ai", "AI Lesson")])

    def __str__(self):
        return self.title


class Lesson(models.Model):
    course = models.ForeignKey(Course, related_name="lessons", on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    video_url = models.URLField(blank=True, null=True)
    content = models.TextField(blank=True, null=True)
    transcript = models.TextField(blank=True, null=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.course.title} - {self.title}"


class Enrollment(models.Model):
    user = models.ForeignKey(User, related_name="enrollments", on_delete=models.CASCADE)
    course = models.ForeignKey(Course, related_name="enrollments", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    progress_percent = models.FloatField(default=0)
    last_lesson = models.ForeignKey(Lesson, null=True, blank=True, on_delete=models.SET_NULL)
    last_position_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("user", "course")

    def __str__(self):
        return f"{self.user.username} -> {self.course.title} ({self.progress_percent:.0f}%)"


class Review(models.Model):
    user = models.ForeignKey(User, related_name="reviews", on_delete=models.CASCADE)
    course = models.ForeignKey(Course, related_name="reviews", on_delete=models.CASCADE)
    rating = models.PositiveIntegerField()
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "course")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.course.title} - {self.rating} by {self.user.username}"


class Note(models.Model):
    user = models.ForeignKey(User, related_name="notes", on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, related_name="notes", on_delete=models.CASCADE)
    timestamp_seconds = models.PositiveIntegerField(default=0)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp_seconds", "created_at"]


class Discussion(models.Model):
    user = models.ForeignKey(User, related_name="discussions", on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, related_name="discussions", on_delete=models.CASCADE)
    text = models.TextField()
    parent = models.ForeignKey("self", null=True, blank=True, related_name="replies", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
