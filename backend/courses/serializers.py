from rest_framework import serializers
from .models import Course, Lesson, Enrollment, Review, Note, Discussion

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = [
            "id",
            "title",
            "video_url",
            "content",
            "transcript",
            "duration_seconds",
            "order",
        ]


class CourseSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "instructor",
            "category",
            "level",
            "language",
            "price",
            "rating_avg",
            "rating_count",
            "tags",
            "trailer_video_url",
            "thumbnail",
            "type",
            "lessons",
        ]


class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = [
            "id",
            "course",
            "created_at",
            "progress_percent",
            "last_lesson",
            "last_position_seconds",
        ]
        read_only_fields = ["id", "created_at"]


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "user", "user_name", "course", "rating", "text", "created_at"]
        read_only_fields = ["id", "created_at", "user"]


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "lesson", "timestamp_seconds", "text", "created_at"]
        read_only_fields = ["id", "created_at"]


class DiscussionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    replies = serializers.SerializerMethodField()

    def get_replies(self, obj):
        qs = obj.replies.order_by("created_at")
        return [
            {"id": r.id, "user_name": r.user.username, "text": r.text, "created_at": r.created_at}
            for r in qs
        ]

    class Meta:
        model = Discussion
        fields = ["id", "user", "user_name", "lesson", "text", "parent", "created_at", "replies"]
        read_only_fields = ["id", "created_at", "user", "replies"]
