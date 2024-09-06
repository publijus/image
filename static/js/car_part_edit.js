document.addEventListener('DOMContentLoaded', function() {
    // Sortable initialization
    new Sortable(document.getElementById('image-list'), {
        animation: 150,
        ghostClass: 'blue-background-class',
        onEnd: updateImageOrder
    });

    // Image editing
    let currentImageItem;
    let cropper;
    let canvas;

    // Bendras įvykių klausytojas visiems paveikslėliams
    $('#image-list').on('click', '.edit-image', function() {
        initializeImageEdit($(this).closest('.image-item'));
    });

    $('#image-list').on('click', '.delete-image', function() {
        deleteImage($(this).closest('.image-item'));
    });

    function initializeImageEdit(imageItem) {
        currentImageItem = imageItem;
        const imageSrc = currentImageItem.data('original-src');
        
        $('#image-editor').html('<img src="' + imageSrc + '" id="image-to-edit">');
        $('#imageEditModal').modal('show');
        
        // Inicializuojame Cropper.js
        cropper = new Cropper(document.getElementById('image-to-edit'), {
            aspectRatio: NaN,
            viewMode: 1,
        });

        // Inicializuojame Fabric.js
        canvas = new fabric.Canvas('annotation-canvas');
        canvas.setWidth($('#image-to-edit').width());
        canvas.setHeight($('#image-to-edit').height());
        
        // Inicializuojame įrankius tik paspaudus mygtukus
        initializeTools();
    }

    function initializeTools() {
        $('#rotateLeft').off('click').on('click', () => cropper.rotate(-90));
        $('#rotateRight').off('click').on('click', () => cropper.rotate(90));
        $('#brightness, #contrast').off('input').on('input', adjustBrightnessContrast);
        $('#crop').off('click').on('click', () => cropper.setDragMode('crop'));
        $('#addRectangle').off('click').on('click', addRectangle);
        $('#addText').off('click').on('click', addText);
        $('#draw').off('click').on('click', toggleDrawMode);
    }

    function addRectangle() {
        let rect = new fabric.Rect({
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: $('#annotationColor').val(),
            strokeWidth: parseInt($('#annotationWidth').val()),
            width: 200,
            height: 100
        });
        canvas.add(rect);
    }

    function addText() {
        let text = new fabric.IText('Įveskite tekstą', {
            left: 100,
            top: 100,
            fontFamily: 'Arial',
            fill: $('#annotationColor').val(),
            fontSize: parseInt($('#annotationWidth').val()) * 5
        });
        canvas.add(text);
    }

    function toggleDrawMode() {
        canvas.isDrawingMode = !canvas.isDrawingMode;
        if (canvas.isDrawingMode) {
            canvas.freeDrawingBrush.color = $('#annotationColor').val();
            canvas.freeDrawingBrush.width = parseInt($('#annotationWidth').val());
        }
    }

    $('#saveImage').on('click', saveEditedImage);

    function saveEditedImage() {
        let imageData = cropper.getCroppedCanvas().toDataURL('image/jpeg');
        
        // Pridedame anotacijas
        let annotatedCanvas = document.createElement('canvas');
        annotatedCanvas.width = cropper.getCroppedCanvas().width;
        annotatedCanvas.height = cropper.getCroppedCanvas().height;
        let ctx = annotatedCanvas.getContext('2d');
        
        // Piešiame apkarpytą vaizdą
        ctx.drawImage(cropper.getCroppedCanvas(), 0, 0);
        
        // Piešiame anotacijas
        ctx.drawImage(canvas.lowerCanvasEl, 0, 0);
        
        imageData = annotatedCanvas.toDataURL('image/jpeg');
        
        // Atnaujinti DOM su nauju paveikslu
        currentImageItem.find('img').attr('src', imageData);
        currentImageItem.find('img').attr('data-edited', 'true');
        
        $('#imageEditModal').modal('hide');
        cropper.destroy();
        canvas.dispose();
    }

    function deleteImage(imageItem) {
        if (confirm('Ar tikrai norite ištrinti šią nuotrauką?')) {
            imageItem.addClass('to-be-deleted').hide();
            updateImageOrder();
        }
    }

    // Function to update image order
    function updateImageOrder() {
        $('.image-item:not(.to-be-deleted)').each(function(index) {
            $(this).find('.order-id').text(index + 1);
            $(this).find('input[name$="-order"]').val(index + 1);
        });
    }

    $('#car-part-form').on('submit', submitForm);

    function submitForm(e) {
        e.preventDefault();
        let formData = new FormData(this);
        
        // Pridedame informaciją apie ištrintus paveikslėlius
        $('.image-item.to-be-deleted').each(function() {
            formData.append('deleted_images[]', $(this).data('id'));
        });
        
        // Pridedame informaciją apie redaguotus paveikslėlius
        $('.image-item img[data-edited="true"]').each(function() {
            formData.append('edited_images[]', JSON.stringify({
                id: $(this).closest('.image-item').data('id'),
                data: this.src
            }));
        });
        
        $('.image-item:not(.to-be-deleted)').each(function(index) {
            formData.append('image_order[]', JSON.stringify({
                id: $(this).data('id'),
                order: index + 1
            }));
        });
        
        // Siunčiame visus pakeitimus į serverį
        $.ajax({
            url: $(this).attr('action'),
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.status === 'success') {
                    window.location.href = "/";
                } else {
                    alert('Įvyko klaida išsaugant pakeitimus');
                }
            }
        });
    }

    $('#addImages').on('click', uploadNewImages);

    function uploadNewImages() {
        const fileInput = document.getElementById('new_images');
        const files = fileInput.files;
        const partId = $('#car-part-form').data('part-id');

        if (files.length === 0) {
            alert('Prašome pasirinkti nuotraukas įkėlimui.');
            return;
        }

        if (!partId) {
            alert('Nepavyko rasti dalies ID. Pabandykite perkrauti puslapį.');
            return;
        }

        const formData = new FormData();
        formData.append('csrfmiddlewaretoken', $('input[name="csrfmiddlewaretoken"]').val());
        for (let i = 0; i < files.length; i++) {
            formData.append('new_images', files[i]);
        }

        $.ajax({
            url: '/upload_images/' + partId + '/',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.status === 'success') {
                    response.images.forEach(addImageToList);
                    updateImageOrder();
                    fileInput.value = ''; // Išvalyti failo įvesties lauką
                } else {
                    alert('Įvyko klaida įkeliant nuotraukas');
                }
            },
            error: function(xhr, status, error) {
                alert('Įvyko klaida įkeliant nuotraukas: ' + error);
            }
        });
    }

    function addImageToList(image) {
        const imageList = document.getElementById('image-list');
        const newImageItem = document.createElement('div');
        newImageItem.className = 'image-item';
        newImageItem.dataset.id = image.id;
        newImageItem.dataset.originalSrc = image.url;  // Pridėkite originalų URL
        newImageItem.innerHTML = `
            <img src="${image.thumbnail_url}" alt="Nuotrauka">
            <div class="order-id">${image.order}</div>
            <div class="actions">
                <i class="fas fa-edit edit-image"></i>
                <i class="fas fa-trash delete-image"></i>
            </div>
            <input type="hidden" name="image-${image.id}-id" value="${image.id}">
            <input type="hidden" name="image-${image.id}-order" value="${image.order}">
        `;
        imageList.appendChild(newImageItem);
    }
});
