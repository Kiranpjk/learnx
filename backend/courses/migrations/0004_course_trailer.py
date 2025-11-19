from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0003_enhancements"),
    ]

    operations = [
        migrations.AddField(
            model_name="course",
            name="trailer_video_url",
            field=models.URLField(blank=True, null=True),
        ),
    ]
