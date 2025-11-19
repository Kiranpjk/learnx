from rest_framework import serializers
from .models import Quiz, Question, Choice, Attempt

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "text"]

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    class Meta:
        model = Question
        fields = ["id", "text", "order", "choices"]

class QuizListSerializer(serializers.ModelSerializer):
    questions_count = serializers.IntegerField(source='questions.count', read_only=True)

    class Meta:
        model = Quiz
        fields = ["id", "title", "description", "time_limit_minutes", "questions_count"]

class QuizDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    class Meta:
        model = Quiz
        fields = ["id", "title", "description", "time_limit_minutes", "questions"]

class AttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attempt
        fields = ["id", "user", "quiz", "score", "started_at", "finished_at"]
        read_only_fields = ["user", "score", "started_at", "finished_at"]
