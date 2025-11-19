from django.urls import path
from .api_views import AIAssistantView, AIGenerateLessonView
urlpatterns = [
    path('ask/', AIAssistantView.as_view(), name='api_ai_ask'),
    path('generate-lesson/', AIGenerateLessonView.as_view(), name='api_ai_generate_lesson'),
]
