from django.urls import path
from . import views

urlpatterns = [
    path('', views.car_part_list, name='car_part_list'),
    path('edit/<int:pk>/', views.car_part_edit, name='car_part_edit'),
    path('upload_images/<int:pk>/', views.upload_images, name='upload_images'),
]