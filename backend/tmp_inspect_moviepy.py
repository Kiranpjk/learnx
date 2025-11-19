import sys
try:
    import moviepy
    import pkgutil
    print('moviepy', moviepy.__version__ if hasattr(moviepy,'__version__') else 'nover', moviepy.__file__)
    print('has editor?', pkgutil.find_loader('moviepy.editor') is not None)
    import importlib
    try:
        mod = importlib.import_module('moviepy.editor')
        print('imported editor ok')
    except Exception as e:
        print('editor import error:', e)
except Exception as e:
    print('no moviepy import:', e)
