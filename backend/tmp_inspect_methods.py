from moviepy import ImageClip
from PIL import Image
img_path='tmp_blank.png'
Image.new('RGB',(100,100),(0,0,0)).save(img_path)
im = ImageClip(img_path)
print('methods with dur:', [m for m in dir(im) if 'dur' in m.lower()])
print('methods with audio:', [m for m in dir(im) if 'audio' in m.lower()])
print('has write_videofile?', hasattr(im, 'write_videofile'))
