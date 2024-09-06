document.addEventListener('DOMContentLoaded', function() {
    // Sortable initialization
    new Sortable(document.getElementById('image-list'), {
        animation: 150,
        ghostClass: 'blue-background-class',
        onEnd: function (evt) {
            updateImageOrder();
        }
    });

    // Image editing
    let currentImageItem;
    let cropper;

    $('.edit-image').on('click', function() {
        currentImageItem = $(this).closest('.image-item');
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
    });

    function initializeTools() {
        $('#rotateLeft').on('click', function() {
            cropper.rotate(-90);
        });

        $('#rotateRight').on('click', function() {
            cropper.rotate(90);
        });

        $('#brightness').on('input', function() {
            adjustBrightnessContrast();
        });

        $('#contrast').on('input', function() {
            adjustBrightnessContrast();
        });

        $('#crop').on('click', function() {
            cropper.setDragMode('crop');
        });

        $('#addRectangle').on('click', function() {
            let rect = new fabric.Rect({
                left: 100,
                top: 100,
                fill: 'transparent',
                stroke: $('#annotationColor').val(),
                strokeWidth: $('#annotationWidth').val(),
                width: 200,
                height: 100
            });
            canvas.add(rect);
        });

        $('#addText').on('click', function() {
            let text = new fabric.IText('Įveskite tekstą', {
                left: 100,
                top: 100,
                fontFamily: 'Arial',
                fill: $('#annotationColor').val(),
                fontSize: $('#annotationWidth').val() * 5
            });
            canvas.add(text);
        });

        $('#draw').on('click', function() {
            canvas.isDrawingMode = !canvas.isDrawingMode;
            if (canvas.isDrawingMode) {
                canvas.freeDrawingBrush.color = $('#annotationColor').val();
                canvas.freeDrawingBrush.width = $('#annotationWidth').val();
            }
        });
    }

    $('#saveImage').on('click', function() {
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
    });

    // Delete image
    $('.delete-image').on('click', function() {
        if (confirm('Ar tikrai norite ištrinti šią nuotrauką?')) {
            $(this).closest('.image-item').addClass('to-be-deleted');
            $(this).closest('.image-item').hide(); // Paslepiame, bet nepašaliname iš DOM
            updateImageOrder();
        }
    });

    // Function to update image order
    function updateImageOrder() {
        $('.image-item:not(.to-be-deleted)').each(function(index) {
            $(this).find('.order-id').text(index + 1);
            $(this).find('input[name$="-order"]').val(index + 1);
        });
    }

    $('#car-part-form').on('submit', function(e) {
        e.preventDefault(); // Sustabdome įprastą formos pateikimą
        
        // Surenkame visus pakeitimus
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
                    alert('Pakeitimai sėkmingai išsaugoti');
                    window.location.reload(); // Perkrauname puslapį, kad atnaujintume vaizdą
                } else {
                    alert('Įvyko klaida išsaugant pakeitimus');
                }
            }
        });
    });
});