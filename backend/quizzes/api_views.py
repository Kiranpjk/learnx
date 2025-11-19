from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Quiz, Question, Choice, Attempt
from .serializers import QuizListSerializer, QuizDetailSerializer, AttemptSerializer
from django.utils import timezone

class QuizListAPI(generics.ListAPIView):
    queryset = Quiz.objects.all()
    serializer_class = QuizListSerializer
    permission_classes = [permissions.AllowAny]


class QuizDetailAPI(generics.RetrieveAPIView):
    queryset = Quiz.objects.all()
    serializer_class = QuizDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class StartAttemptAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, id=quiz_id)
        attempt = Attempt.objects.create(user=request.user, quiz=quiz)
        return Response({"attempt_id": attempt.id}, status=status.HTTP_201_CREATED)


class SubmitAttemptAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, attempt_id):
        """
        Expects payload:
        {
          "answers": [
             {"question_id": 1, "choice_id": 10},
             {"question_id": 2, "choice_id": 15},
             ...
          ]
        }
        """
        attempt = get_object_or_404(Attempt, id=attempt_id, user=request.user)
        if attempt.finished_at is not None:
            return Response({"detail": "Attempt already submitted."}, status=status.HTTP_400_BAD_REQUEST)

        answers = request.data.get("answers", [])
        total = 0
        correct = 0

        for a in answers:
            qid = a.get("question_id")
            cid = a.get("choice_id")
            try:
                question = Question.objects.get(id=qid, quiz=attempt.quiz)
                choice = Choice.objects.get(id=cid, question=question)
            except (Question.DoesNotExist, Choice.DoesNotExist):
                continue

            total += 1
            if choice.is_correct:
                correct += 1

        score = 0.0
        if total > 0:
            score = (correct / total) * 100.0

        attempt.score = score
        attempt.finished_at = timezone.now()
        attempt.save()

        return Response({"score": score, "correct": correct, "total": total})
