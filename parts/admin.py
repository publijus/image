from django.contrib import admin
from .models import CarPart, CarPartImage

class CarPartImageInline(admin.TabularInline):
    model = CarPartImage
    extra = 1

class CarPartAdmin(admin.ModelAdmin):
    inlines = [CarPartImageInline]

admin.site.register(CarPart, CarPartAdmin)