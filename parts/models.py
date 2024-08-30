from django.db import models

class CarPart(models.Model):
    part_code = models.CharField(max_length=100)
    warehouse_code = models.CharField(max_length=100)

class CarPartImage(models.Model):
    car_part = models.ForeignKey(CarPart, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='car_parts/')
    thumbnail = models.ImageField(upload_to='car_parts/thumbnails/', null=True, blank=True)