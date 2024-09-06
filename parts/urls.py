from django.urls import path
from . import views

urlpatterns = [
    path('', views.car_part_list, name='car_part_list'),
    path('edit/<int:pk>/', views.car_part_edit, name='car_part_edit'),
    path('upload_images/<int:pk>/', views.upload_images, name='upload_images'),
    path('delete_image/<int:image_id>/', views.delete_image, name='delete_image'),
    path('edit_image/<int:image_id>/', views.edit_image, name='edit_image'),
    path('update_image_order/', views.update_image_order, name='update_image_order'),
]