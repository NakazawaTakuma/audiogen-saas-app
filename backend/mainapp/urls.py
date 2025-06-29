from django.urls import path, include
 
urlpatterns = [
    path('audio/', include('mainapp.audio.urls')),
    path('users/', include('mainapp.users.urls')),
    path('billing/', include('mainapp.billing.urls')),
] 