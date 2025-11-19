try:
    from moviepy import ImageClip, AudioFileClip
    print('OK')
except Exception as e:
    print('ERR', e)
