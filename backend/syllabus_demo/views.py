from django.shortcuts import render
from django.http import HttpResponse

def index(request):
    # Unit VI: Sessions and Cookies
    # Count visits using session
    visit_count = request.session.get('visit_count', 0) + 1
    request.session['visit_count'] = visit_count
    
    # Unit III: Django Template Language (DTL)
    # Passing context to template
    context = {
        'title': 'Syllabus Coverage Demo',
        'visit_count': visit_count,
        'syllabus_units': [
            {'unit': 'I', 'name': 'Django Setup', 'status': 'Covered'},
            {'unit': 'II', 'name': 'Models, Views, URLs', 'status': 'Covered'},
            {'unit': 'III', 'name': 'Templates (DTL)', 'status': 'Covered (This Page)'},
            {'unit': 'IV', 'name': 'Forms', 'status': 'Covered (Contact Page)'},
            {'unit': 'V', 'name': 'Admin Interface', 'status': 'Covered'},
            {'unit': 'VI', 'name': 'Sessions & Cookies', 'status': 'Covered (Visit Counter)'},
        ]
    }
    
    response = render(request, 'syllabus_demo/index.html', context)
    
    # Unit VI: Setting a cookie
    response.set_cookie('demo_cookie', 'syllabus_verified')
    
    return response
