try:
    import moviepy.editor as me
    import imageio_ffmpeg
    print('OK')
except Exception as e:
    print('ERR', e)
