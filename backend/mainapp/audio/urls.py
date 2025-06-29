from django.urls import path
from .views import AudioGenerateView
 
urlpatterns = [
    path('generate/', AudioGenerateView.as_view(), name='audio-generate'),
] 