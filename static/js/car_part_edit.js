document.addEventListener('DOMContentLoaded', function() {
    // Sortable initialization
    new Sortable(document.getElementById('image-list'), {
        animation: 150,
        ghostClass: 'blue-background-class',
        onEnd: updateImageOrder
    });

    // Image editing
    let currentImageItem;
    let imageEditor;
//    let filerobotImageEditor; // Paskelbkite šį kintamąjį globaliai failo pradžioje

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

        const TABS = window.FilerobotImageEditor.TABS;
        const TOOLS = window.FilerobotImageEditor.TOOLS;

        //$('#image-editor-container').html('');
        $('#image-editor-container').modal('show');
        // Parodykite modalą
      //  $('#image-editor-container').show(); // Įsitikinkite, kad konteineris yra matomas

        const config = {
            source: imageSrc,
            onSave: (editedImageObject, designState) => {
                saveEditedImage(editedImageObject.imageBase64);
                $('#image-editor-container').modal('hide');
                imageEditor.terminate();
            },
            onClose: () => {
                $('#image-editor-container').modal('hide');
                imageEditor.terminate();
            },
            annotationsCommon: {
                fill: '#ff00a2'
            },
            Text: { text: 'Įveskite tekstą' },
            Rotate: {
                angle: 90,
                componentType: 'buttons'
            },
           
            theme: {
                palette: {
                    'bg-primary': '#2196f3',
                    'bg-secondary': '#e0e0e0',
                },
                typography: {
                    fontFamily: 'Roboto, Arial, sans-serif',
                }
            },
         //   tabsIds: [window.FilerobotImageEditor.TABS.ADJUST, window.FilerobotImageEditor.TABS.ANNOTATE, window.FilerobotImageEditor.TABS.WATERMARK],
            defaultTabId: window.FilerobotImageEditor.TABS.ADJUST,
            defaultToolId: window.FilerobotImageEditor.TOOLS.CROP,
          //  showInModal: true,
            useBackendTranslations: false,
            showInModal: true,
            modalSize: 'large'
        };

        imageEditor = new FilerobotImageEditor(
            document.querySelector('#image-editor-container'),
            config
        );

        imageEditor.render();
     //   imageEditor.render({
     //       onClose: () => {
     //           $('#image-editor-container').modal('hide');
     //       }
        //});
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
