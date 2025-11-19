from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.authentication import BaseAuthentication
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.http import HttpResponse
from django.conf import settings
from ai.video_utils import generate_short_video

from .models import Course, Lesson, Enrollment, Review, Note, Discussion
from .serializers import (
    CourseSerializer,
    LessonSerializer,
    EnrollmentSerializer,
    ReviewSerializer,
    NoteSerializer,
    DiscussionSerializer,
)


class CourseListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type[BaseAuthentication]] = []

    def get(self, request):
        qs = Course.objects.all()
        # simple facets: category, level, language, min_rating, max_price, q
        category = request.query_params.get("category")
        level = request.query_params.get("level")
        language = request.query_params.get("language")
        min_rating = request.query_params.get("min_rating")
        max_price = request.query_params.get("max_price")
        q = request.query_params.get("q")
        if category:
            qs = qs.filter(category__iexact=category)
        if level:
            qs = qs.filter(level=level)
        if language:
            qs = qs.filter(language__iexact=language)
        if min_rating:
            try:
                qs = qs.filter(rating_avg__gte=float(min_rating))
            except Exception:
                pass
        if max_price:
            try:
                qs = qs.filter(price__lte=float(max_price))
            except Exception:
                pass
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q) | Q(tags__icontains=q))
        return Response(CourseSerializer(qs, many=True).data)


class CourseDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type[BaseAuthentication]] = []

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        
        # Session Logic: Track recently viewed courses
        viewed = request.session.get('viewed_courses', [])
        if pk in viewed:
            viewed.remove(pk)
        viewed.insert(0, pk)
        request.session['viewed_courses'] = viewed[:5]  # Keep last 5
        
        return Response(CourseSerializer(course).data)


class RecentlyViewedCoursesView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        viewed_ids = request.session.get('viewed_courses', [])
        # Preserve order
        courses = []
        for pk in viewed_ids:
            try:
                courses.append(Course.objects.get(pk=pk))
            except Course.DoesNotExist:
                pass
        return Response(CourseSerializer(courses, many=True).data)


class CourseRelatedView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type[BaseAuthentication]] = []

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        qs = Course.objects.filter(category__iexact=course.category).exclude(id=pk)[:6]
        return Response(CourseSerializer(qs, many=True).data)


class LessonListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type[BaseAuthentication]] = []

    def get(self, request, pk):
        lessons = Lesson.objects.filter(course_id=pk).order_by("order")
        return Response(LessonSerializer(lessons, many=True).data)


class LessonDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type[BaseAuthentication]] = []

    def get(self, request, pk, lesson_id):
        lesson = get_object_or_404(Lesson, course_id=pk, id=lesson_id)
        
        # Find next lesson
        next_lesson = Lesson.objects.filter(course_id=pk, order__gt=lesson.order).order_by('order').first()
        # Find prev lesson
        prev_lesson = Lesson.objects.filter(course_id=pk, order__lt=lesson.order).order_by('-order').first()

        data = LessonSerializer(lesson).data
        data['next_lesson_id'] = next_lesson.id if next_lesson else None
        data['prev_lesson_id'] = prev_lesson.id if prev_lesson else None
        
        return Response(data)


class EnrollView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        obj, created = Enrollment.objects.get_or_create(user=request.user, course=course)
        return Response(EnrollmentSerializer(obj).data, status=201 if created else 200)

    def delete(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        Enrollment.objects.filter(user=request.user, course=course).delete()
        return Response(status=204)


class EnrollmentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        obj = Enrollment.objects.filter(user=request.user, course=course).first()
        if not obj:
            return Response({"enrolled": False})
        data = EnrollmentSerializer(obj).data
        data["enrolled"] = True
        return Response(data)


class ProgressUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        enrollment = Enrollment.objects.filter(user=request.user, course=course).first()
        if not enrollment:
            return Response({"detail": "Not enrolled"}, status=403)
        lesson_id = request.data.get("lesson_id")
        position = int(request.data.get("position_seconds") or 0)
        percent = float(request.data.get("progress_percent") or 0)
        if lesson_id:
            lesson = Lesson.objects.filter(course=course, id=lesson_id).first()
            if lesson:
                enrollment.last_lesson = lesson
        enrollment.last_position_seconds = max(position, 0)
        enrollment.progress_percent = max(0, min(100, percent))
        enrollment.save()
        return Response(EnrollmentSerializer(enrollment).data)


class ReviewListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        reviews = Review.objects.filter(course_id=pk).select_related("user")
        return Response(ReviewSerializer(reviews, many=True).data)

    def post(self, request, pk):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=401)
        course = get_object_or_404(Course, pk=pk)
        rating = int(request.data.get("rating") or 0)
        text = (request.data.get("text") or "").strip()
        if rating < 1 or rating > 5:
            return Response({"detail": "rating 1-5"}, status=400)
        # create or update user's review
        review, created = Review.objects.update_or_create(
            user=request.user, course=course, defaults={"rating": rating, "text": text}
        )
        # update aggregates
        agg = Review.objects.filter(course=course)
        count = agg.count()
        avg = agg.aggregate_val if False else (sum(r.rating for r in agg) / count if count else 0)
        course.rating_avg = round(avg, 2)
        course.rating_count = count
        course.save(update_fields=["rating_avg", "rating_count"])
        return Response(ReviewSerializer(review).data, status=201 if created else 200)


class NotesListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, lesson_id):
        qs = Note.objects.filter(user=request.user, lesson_id=lesson_id)
        return Response(NoteSerializer(qs, many=True).data)

    def post(self, request, pk, lesson_id):
        data = {
            "lesson": lesson_id,
            "timestamp_seconds": int(request.data.get("timestamp_seconds") or 0),
            "text": (request.data.get("text") or "").strip(),
        }
        ser = NoteSerializer(data=data)
        ser.is_valid(raise_exception=True)
        # Pass user directly to save() to avoid IntegrityError
        note = ser.save(user=request.user)
        return Response(NoteSerializer(note).data, status=201)


class DiscussionListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk, lesson_id):
        qs = Discussion.objects.filter(lesson_id=lesson_id, parent__isnull=True).select_related("user")
        return Response(DiscussionSerializer(qs, many=True).data)

    def post(self, request, pk, lesson_id):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=401)
        data = {
            "lesson": lesson_id,
            "text": (request.data.get("text") or "").strip(),
            "parent": request.data.get("parent"),
        }
        ser = DiscussionSerializer(data=data)
        ser.is_valid(raise_exception=True)
        # Pass user directly to save() to avoid IntegrityError
        obj = ser.save(user=request.user)
        return Response(DiscussionSerializer(obj).data, status=201)


class CertificateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        enrollment = Enrollment.objects.filter(user=request.user, course=course).first()
        if not enrollment or enrollment.progress_percent < 100:
            return Response({"detail": "Completion required"}, status=403)
        # generate a simple PDF certificate
        try:
            from reportlab.pdfgen import canvas
            from io import BytesIO
            buffer = BytesIO()
            p = canvas.Canvas(buffer)
            p.setTitle("Certificate of Completion")
            p.setFont("Helvetica-Bold", 24)
            p.drawCentredString(300, 770, "Certificate of Completion")
            p.setFont("Helvetica", 14)
            p.drawCentredString(300, 720, f"This certifies that {request.user.username}")
            p.drawCentredString(300, 700, f"has successfully completed")
            p.setFont("Helvetica-Bold", 16)
            p.drawCentredString(300, 675, f"{course.title}")
            p.setFont("Helvetica", 12)
            p.drawCentredString(300, 640, "Date: ")
            p.drawCentredString(350, 640, __import__('datetime').datetime.utcnow().strftime('%Y-%m-%d'))
            p.showPage()
            p.save()
            pdf = buffer.getvalue()
            buffer.close()
            resp = HttpResponse(pdf, content_type='application/pdf')
            resp['Content-Disposition'] = f'inline; filename="certificate_{course.id}.pdf"'
            return resp
        except Exception:
            return Response({"detail":"Failed to generate certificate"}, status=500)


class GenerateCourseTrailerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        # Compose short text from title + first sentence of description
        desc = (course.description or "").strip().split(".")[0]
        text = f"{course.title}\n{desc[:200]}"
        url, err = generate_short_video(text, subfolder="courses", filename_prefix=f"course_{course.id}", seconds=int(request.data.get("seconds", 8)))
        if url:
            course.trailer_video_url = url
            course.save(update_fields=["trailer_video_url"])
            return Response({"video_url": url, "error": err})
        return Response({"detail": "Failed to generate video", "error": err}, status=500)


class GenerateLessonVideoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, lesson_id):
        lesson = get_object_or_404(Lesson, course_id=pk, id=lesson_id)
        # Prefer transcript first paragraph; else title
        transcript = (lesson.transcript or "").strip()
        first_para = transcript.split("\n\n")[0] if transcript else ""
        text = f"{lesson.title}\n{first_para[:220]}" if first_para else lesson.title
        url, err = generate_short_video(text, subfolder="lessons", filename_prefix=f"lesson_{lesson.id}", seconds=int(request.data.get("seconds", 8)))
        if url:
            lesson.video_url = url
            lesson.save(update_fields=["video_url"])
            return Response({"video_url": url, "error": err})
        return Response({"detail": "Failed to generate video", "error": err}, status=500)


class GenerateAllVideosView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        seconds = int(request.data.get("seconds", 8))
        updated = {"courses": 0, "lessons": 0}
        # Courses trailers
        for c in Course.objects.all():
            if not c.trailer_video_url:
                desc = (c.description or "").strip().split(".")[0]
                text = f"{c.title}\n{desc[:200]}"
                url, err = generate_short_video(text, subfolder="courses", filename_prefix=f"course_{c.id}", seconds=seconds)
                if url:
                    c.trailer_video_url = url
                    c.save(update_fields=["trailer_video_url"])
                    updated["courses"] += 1
        # Lessons
        for l in Lesson.objects.all():
            if not l.video_url:
                transcript = (l.transcript or "").strip()
                first_para = transcript.split("\n\n")[0] if transcript else ""
                text = f"{l.title}\n{first_para[:220]}" if first_para else l.title
                url, err = generate_short_video(text, subfolder="lessons", filename_prefix=f"lesson_{l.id}", seconds=seconds)
                if url:
                    l.video_url = url
                    l.save(update_fields=["video_url"])
                    updated["lessons"] += 1
        return Response({"updated": updated})


class EnrolledCoursesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        enrollments = Enrollment.objects.filter(user=request.user).select_related('course')
        data = []
        for e in enrollments:
            c = e.course
            data.append({
                "id": c.id,
                "title": c.title,
                "thumbnail": c.thumbnail,
                "level": c.level,
                "type": c.type,
                "progress_percent": e.progress_percent,
                "last_position_seconds": e.last_position_seconds,
                "last_lesson_id": e.last_lesson_id
            })
        return Response(data)
