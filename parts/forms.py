from django import forms
from .models import CarPart, CarPartImage

class CarPartForm(forms.ModelForm):
    class Meta:
        model = CarPart
        fields = ['part_code', 'warehouse_code']

class CarPartImageForm(forms.ModelForm):
    class Meta:
        model = CarPartImage
        fields = ['image']