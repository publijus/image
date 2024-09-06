from django import forms
from django.forms import inlineformset_factory
from .models import CarPart, CarPartImage

class CarPartForm(forms.ModelForm):
    class Meta:
        model = CarPart
        fields = ['part_code', 'warehouse_code']
       

class CarPartImageForm(forms.ModelForm):
    class Meta:
        model = CarPartImage
        fields = ['order']
        widgets = {
            'order': forms.HiddenInput(),
        }

CarPartImageFormSet = inlineformset_factory(
    CarPart, CarPartImage, form=CarPartImageForm,
    extra=0, can_delete=False
)