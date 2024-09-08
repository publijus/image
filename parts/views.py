import base64
import json
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Max
from .models import CarPart, CarPartImage
from .forms import CarPartForm, CarPartImageFormSet
from PIL import Image
import os
from django.core.files.base import ContentFile

def car_part_list(request):
    parts = CarPart.objects.all()
    return render(request, 'parts/car_part_list.html', {'parts': parts})

def car_part_edit(request, pk):
    part = get_object_or_404(CarPart, pk=pk)
    if request.method == "POST":
        form = CarPartForm(request.POST, instance=part)
        formset = CarPartImageFormSet(request.POST, request.FILES, instance=part)
        
        if form.is_valid() and formset.is_valid():
            form.save()
            formset.save()
            
            # Apdorojame ištrintus paveikslėlius
            deleted_images = request.POST.getlist('deleted_images[]')
            CarPartImage.objects.filter(id__in=deleted_images).delete()
            
            # Apdorojame redaguotus paveikslėlius
            for key, value in request.POST.items():
                if key.startswith('edited_image_'):
                    image_id = key.split('_')[-1]
                    image = CarPartImage.objects.get(id=image_id)
                    format, imgstr = value.split(';base64,')
                    ext = format.split('/')[-1]
                    data = ContentFile(base64.b64decode(imgstr), name=f'edited_image_{image.id}.{ext}')
                    image.image.save(f'edited_image_{image.id}.{ext}', data, save=True)
                    create_thumbnail(image)
            
            # Apdorojame pakeistą tvarką
            image_order = json.loads(request.POST.get('image_order', '[]'))
            for order_data in image_order:
                image = CarPartImage.objects.get(id=order_data['id'])
                image.order = order_data['order']
                image.save()
            
            return JsonResponse({'status': 'success'})
        else:
            return JsonResponse({'status': 'error', 'errors': form.errors})
    else:
        form = CarPartForm(instance=part)
        formset = CarPartImageFormSet(instance=part)
    return render(request, 'parts/car_part_edit.html', {'form': form, 'formset': formset, 'part': part})

@csrf_exempt
def upload_images(request, pk):
    part = get_object_or_404(CarPart, pk=pk)
    if request.method == 'POST':
        new_images = []
        max_order = CarPartImage.objects.filter(car_part=part).aggregate(Max('order'))['order__max'] or 0
        for file in request.FILES.getlist('new_images'):
            max_order += 1
            image = CarPartImage(car_part=part, image=file, order=max_order)
            image.save()
            create_thumbnail(image)
            new_images.append({
                'id': image.id,
                'url': image.image.url,
                'thumbnail_url': image.thumbnail.url,
                'order': image.order
            })
        return JsonResponse({'status': 'success', 'images': new_images})
    return JsonResponse({'status': 'error'})

def create_thumbnail(image):
    img = Image.open(image.image.path)
    img.thumbnail((200, 200))
    thumb_dir = os.path.join('media/car_parts/thumbnails')
    if not os.path.exists(thumb_dir):
        os.makedirs(thumb_dir)
    thumb_path = os.path.join(thumb_dir, os.path.basename(image.image.path))
    img.save(thumb_path)
    image.thumbnail.name = os.path.join('car_parts/thumbnails', os.path.basename(image.image.path))
    image.save()
