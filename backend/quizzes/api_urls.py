from django.urls import path
from .api_views import QuizListAPI, QuizDetailAPI, StartAttemptAPI, SubmitAttemptAPI

urlpatterns = [
    path("", QuizListAPI.as_view()),
    path("<int:pk>/", QuizDetailAPI.as_view()),
    path("<int:quiz_id>/start/", StartAttemptAPI.as_view()),
    path("attempt/<int:attempt_id>/submit/", SubmitAttemptAPI.as_view()),
]
