from django.core.management.base import BaseCommand
from courses.models import Lesson
from ai.llm_utils import groq_completion, gemini_completion, chat_completion, get_openai_client
from ai.video_utils import generate_short_video
import time

class Command(BaseCommand):
    help = 'Generate transcripts and videos for lessons that miss them'

    def handle(self, *args, **options):
        lessons = Lesson.objects.all()
        self.stdout.write(f"Found {lessons.count()} lessons.")

        for lesson in lessons:
            self.stdout.write(f"Processing lesson: {lesson.title} (ID: {lesson.id})")
            
            # 1. Generate Transcript if missing
            if not lesson.transcript or len(lesson.transcript) < 50:
                self.stdout.write("  - Generating transcript...")
                prompt = (
                    f"Create a structured mini-lesson on: {lesson.title}. "
                    "Use clear section headings, concise explanations, and bullet lists. "
                    "Keep it beginner-friendly. Respond in plain UTF-8 text only."
                )
                messages = [
                    {"role": "system", "content": "You are an expert course author."},
                    {"role": "user", "content": prompt},
                ]
                
                transcript = None
                # Try Groq
                t, _, _ = groq_completion(messages, temperature=0.4, max_tokens=1000)
                if t: transcript = t
                
                # Try Gemini
                if not transcript:
                    t, _, _ = gemini_completion(messages, temperature=0.4, max_tokens=1000)
                    if t: transcript = t
                
                # Try OpenAI
                if not transcript:
                    client = get_openai_client()
                    if client:
                        t, _, _ = chat_completion(client, messages, temperature=0.4, max_tokens=1000)
                        if t: transcript = t
                
                if transcript:
                    lesson.transcript = transcript
                    lesson.content = transcript # Also set content
                    lesson.save()
                    self.stdout.write("  - Transcript saved.")
                else:
                    self.stdout.write("  - Failed to generate transcript.")
            else:
                self.stdout.write("  - Transcript exists.")

            # 2. Generate Video if missing or placeholder
            if not lesson.video_url or "sample-5s" in lesson.video_url:
                self.stdout.write("  - Generating video...")
                # Use title + first paragraph of transcript
                text_for_video = f"{lesson.title}\n"
                if lesson.transcript:
                    text_for_video += lesson.transcript.split('\n\n')[0][:200]
                
                filename_prefix = f"lesson_{lesson.id}_{lesson.title.replace(' ', '_')[:20]}"
                # Clean filename
                filename_prefix = "".join([c for c in filename_prefix if c.isalnum() or c in ('_', '-')])
                
                url, err = generate_short_video(text_for_video, subfolder="lessons", filename_prefix=filename_prefix, seconds=10)
                
                if url:
                    lesson.video_url = url
                    lesson.save()
                    self.stdout.write(f"  - Video generated: {url}")
                else:
                    self.stdout.write(f"  - Failed to generate video: {err}")
            else:
                self.stdout.write("  - Video exists.")
            
            time.sleep(1) # Rate limit politeness
