from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='syllabus_demo_index'),
]
