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
        
    });

    $('#rotateLeft').on('click', function() {
        cropper.rotate(-90);
    });

    $('#rotateRight').on('click', function() {
        cropper.rotate(90);
    });

    $('#crop').on('click', function() {
        cropper.setDragMode('crop');
    });

    $('#saveImage').on('click', function() {
        let canvas = cropper.getCroppedCanvas();
        let imageData = canvas.toDataURL('image/jpeg');
        
        // Atnaujinti DOM su nauju paveikslu
        currentImageItem.find('img').attr('src', imageData);
        currentImageItem.find('img').attr('data-edited', 'true');
        
        $('#imageEditModal').modal('hide');
        cropper.destroy();
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