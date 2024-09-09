document.addEventListener('DOMContentLoaded', function() {

    checkTotalImageCount();

    // Sortable initialization
    new Sortable(document.getElementById('image-list'), {
        animation: 150,
        ghostClass: 'blue-background-class',
        onEnd: updateImageOrder
    });

    let currentImageItem;

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

        $('#image-editor-container').modal('show');

        $('#image-editor-container').on('shown.bs.modal', function () {
            const instance = new tui.ImageEditor(document.querySelector('#tui-image-editor'), {
                includeUI: {
                    loadImage: {
                        path: imageSrc, // Naudokite imageSrc
                        name: 'SampleImage'
                    },
                    menu: ['crop', 'rotate','draw', 'shape', 'icon','text', 'mask', 'filter'],
                    initMenu: 'draw',
                    uiSize: {
                        width: '100%',
                        height: '100%'
                    },
                    menuBarPosition: 'right'
                },
            //    cssMaxWidth: 200,
            //    cssMaxHeight: 200,
                selectionStyle: {
                    cornerSize: 20,
                    rotatingPointOffset: 70
                }
            });

            // Pridedame mygtukų klausytojus čia
            document.getElementById('save-button').addEventListener('click', function() {
                const quality = 0.8; // Nustatykite kokybę nuo 0 iki 1 (1 yra aukščiausia kokybė)
                const format = 'jpeg';
                const result = instance.toDataURL({
                    format: format,
                    quality: quality
                });
                saveEditedImage(result);
                $('#image-editor-container').modal('hide');
            });

            document.getElementById('close-button').addEventListener('click', function() {
                instance.destroy();
                $('#image-editor-container').modal('hide');
            });

        });
    }

    function saveEditedImage(imageData) {
        // Atnaujinti DOM su nauju paveikslu, bet neišsaugoti į serverį
        currentImageItem.find('img').attr('src', imageData);
        currentImageItem.find('img').attr('data-edited', 'true');
        currentImageItem.attr('data-edited-src', imageData);
    }

    function deleteImage(imageItem) {
        if (confirm('Ar tikrai norite ištrinti šią nuotrauką?')) {
            imageItem.addClass('to-be-deleted').hide();
            updateImageOrder();
            checkTotalImageCount();
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
        $('.image-item[data-edited-src]').each(function() {
            let imageData = $(this).attr('data-edited-src');
            let imageId = $(this).data('id');
            formData.append(`edited_image_${imageId}`, imageData);
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
        const currentImageCount = $('.image-item:not(.to-be-deleted)').length;

        if (files.length === 0) {
            alert('Prašome pasirinkti nuotraukas įkėlimui.');
            return;
        }

        if (currentImageCount + files.length > MAX_IMAGES) {
            alert(`Galite įkelti ne daugiau kaip ${MAX_IMAGES} nuotraukų. Šiuo metu jau turite ${currentImageCount} nuotraukų.`);
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
        checkTotalImageCount();
    }

});

const MAX_IMAGES = 24;

// Pridėkite šią funkciją, kad patikrintumėte bendrą nuotraukų skaičių
function checkTotalImageCount() {
    const currentImageCount = $('.image-item:not(.to-be-deleted)').length;
    if (currentImageCount >= MAX_IMAGES) {
        $('#addImages').prop('disabled', true);
        $('#new_images').prop('disabled', true);
    } else {
        $('#addImages').prop('disabled', false);
        $('#new_images').prop('disabled', false);
    }
}
