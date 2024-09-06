from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Max
from .models import CarPart, CarPartImage
from .forms import CarPartForm, CarPartImageFormSet
from PIL import Image, ImageEnhance, ImageDraw, ImageFont
import os

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
            return redirect('car_part_edit', pk=pk)
    else:
        form = CarPartForm(instance=part)
        formset = CarPartImageFormSet(instance=part)
    return render(request, 'parts/car_part_edit.html', {'form': form, 'formset': formset, 'part': part})

@csrf_exempt
def upload_images(request, pk):
    part = get_object_or_404(CarPart, pk=pk)
    if request.method == 'POST':
        for file in request.FILES.getlist('images'):
            max_order = CarPartImage.objects.filter(car_part=part).aggregate(Max('order'))['order__max'] or 0
            image = CarPartImage(car_part=part, image=file, order=max_order + 1)
            image.save()
            create_thumbnail(image)
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'})

@csrf_exempt
def update_image_order(request):
    if request.method == 'POST':
        image_ids = request.POST.getlist('image_ids[]')
        valid_image_ids = [id for id in image_ids if id.isdigit()]
        
        for index, image_id in enumerate(valid_image_ids):
            try:
                image = CarPartImage.objects.get(id=int(image_id))
                image.order = index
                image.save()
            except CarPartImage.DoesNotExist:
                continue  # Ignoruojame neegzistuojančius ID
        
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'})

def create_thumbnail(image):
    img = Image.open(image.image.path)
    img.thumbnail((100, 100))
    thumb_dir = os.path.join('media/car_parts/thumbnails')
    if not os.path.exists(thumb_dir):
        os.makedirs(thumb_dir)
    thumb_path = os.path.join(thumb_dir, os.path.basename(image.image.path))
    img.save(thumb_path)
    image.thumbnail.name = os.path.join('car_parts/thumbnails', os.path.basename(image.image.path))
    image.save()

def delete_image(request, image_id):
    image = get_object_or_404(CarPartImage, id=image_id)
    image.delete()
    return redirect('car_part_edit', pk=image.car_part.id)

@csrf_exempt
def edit_image(request, image_id):
    image = get_object_or_404(CarPartImage, id=image_id)
    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'rotate':
            direction = request.POST.get('direction')
            rotate_image(image, direction)
        elif action == 'adjust':
            brightness = float(request.POST.get('brightness', 1))
            contrast = float(request.POST.get('contrast', 1))
            adjust_image(image, brightness, contrast)
        elif action == 'crop':
            left = int(request.POST.get('left'))
            top = int(request.POST.get('top'))
            right = int(request.POST.get('right'))
            bottom = int(request.POST.get('bottom'))
            crop_image(image, left, top, right, bottom)
        elif action == 'annotate':
            text = request.POST.get('text')
            annotate_image(image, text)
        create_thumbnail(image)
        return JsonResponse({'status': 'success'})
    return render(request, 'parts/edit_image.html', {'image': image})

def rotate_image(image, direction):
    img = Image.open(image.image.path)
    if direction == 'left':
        img = img.rotate(90, expand=True)
    else:
        img = img.rotate(-90, expand=True)
    img.save(image.image.path)

def adjust_image(image, brightness, contrast):
    img = Image.open(image.image.path)
    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(brightness)
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(contrast)
    img.save(image.image.path)

def crop_image(image, left, top, right, bottom):
    img = Image.open(image.image.path)
    img = img.crop((left, top, right, bottom))
    img.save(image.image.path)

def annotate_image(image, text):
    img = Image.open(image.image.path)
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    draw.text((10, 10), text, font=font, fill="white")
    img.save(image.image.path)