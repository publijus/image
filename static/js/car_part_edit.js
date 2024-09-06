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
    let currentImage;
    let cropper;

    $('.edit-image').on('click', function() {
        const imageSrc = $(this).closest('.image-item').data('original-src'); // Gauti originalios nuotraukos URL iš duomenų atributo
        $('#image-editor').css('background-image', 'url(' + imageSrc + ')'); // Nustatyti modalą su originalia nuotrauka
        $('#imageEditModal').modal('show'); // Atidaryti modalą
    });

    $('#rotateLeft').on('click', function() {
        cropper.rotate(-90);
    });

    $('#rotateRight').on('click', function() {
        cropper.rotate(90);
    });

    $('#crop').on('click', function() {
        let croppedCanvas = cropper.getCroppedCanvas();
        currentImage.src = croppedCanvas.toDataURL();
    });

    $('#saveImage').on('click', function() {
        let imageData = cropper.getCroppedCanvas().toDataURL();
        // Here you would typically send this data to the server to save the changes
        $('#imageEditModal').modal('hide');
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
        $('.image-item').each(function(index) {
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
        
        // Pridedame informaciją apie pakeistą tvarką
        $('.image-item').each(function(index) {
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