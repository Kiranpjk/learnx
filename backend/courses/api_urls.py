from django.urls import path
from .api_views import (
    CourseListView,
    CourseDetailView,
    CourseRelatedView,
    LessonListView,
    LessonDetailView,
    EnrollView,
    EnrollmentDetailView,
    ProgressUpdateView,
    ReviewListCreateView,
    NotesListCreateView,
    DiscussionListCreateView,
    CertificateView,
    GenerateCourseTrailerView,
    GenerateLessonVideoView,
    GenerateAllVideosView,
    EnrolledCoursesView,
    RecentlyViewedCoursesView,
)

urlpatterns = [
    path("", CourseListView.as_view()),
    path("enrolled/", EnrolledCoursesView.as_view()),
    path("recently_viewed/", RecentlyViewedCoursesView.as_view()),
    path("<int:pk>/", CourseDetailView.as_view()),
    path("<int:pk>/related/", CourseRelatedView.as_view()),
    path("<int:pk>/lessons/", LessonListView.as_view()),
    path("<int:pk>/lessons/<int:lesson_id>/", LessonDetailView.as_view()),
    # enrollment & progress
    path("<int:pk>/enroll/", EnrollView.as_view()),
    path("<int:pk>/enrollment/", EnrollmentDetailView.as_view()),
    path("<int:pk>/progress/", ProgressUpdateView.as_view()),
    # reviews
    path("<int:pk>/reviews/", ReviewListCreateView.as_view()),
    # notes and discussions per lesson
    path("<int:pk>/lessons/<int:lesson_id>/notes/", NotesListCreateView.as_view()),
    path("<int:pk>/lessons/<int:lesson_id>/discussions/", DiscussionListCreateView.as_view()),
    # certificate
    path("<int:pk>/certificate/", CertificateView.as_view()),
    # video generation
    path("<int:pk>/generate_trailer/", GenerateCourseTrailerView.as_view()),
    path("<int:pk>/lessons/<int:lesson_id>/generate_video/", GenerateLessonVideoView.as_view()),
    path("generate_all_videos/", GenerateAllVideosView.as_view()),
]
