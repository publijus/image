function initializeImageEdit(imageItem) {
    currentImageItem = imageItem;
    const imageSrc = currentImageItem.data('original-src');

    $('#image-editor').html('');
    $('#imageEditModal').modal('show');
    
    const config = {
        source: imageSrc,
        onSave: (editedImageObject, designState) => {
            saveEditedImage(editedImageObject.imageBase64);
            $('#imageEditModal').modal('hide');
        },
        annotationsCommon: {
            fill: '#ff0000'
        },
        Text: { text: 'Įveskite tekstą' },
        translations: {
            profile: 'Profilis',
            coverPhoto: 'Viršelio nuotrauka',
            facebook: 'Facebook',
            socialMedia: 'Socialinė medija',
            fbProfileSize: 'Facebook profilio dydis',
            fbCoverPhotoSize: 'Facebook viršelio nuotraukos dydis',
            save: 'Išsaugoti',
            saveAs: 'Išsaugoti kaip',
            back: 'Atgal',
            // ... kiti vertimai ...
        },
        theme: {
            palette: {
                'bg-primary': '#2196f3',
                'bg-secondary': '#e0e0e0',
            },
            typography: {
                fontFamily: 'Arial, sans-serif',
            }
        }
    };

    imageEditor = new FilerobotImageEditor(config);
    imageEditor.open(imageSrc);
}

function saveEditedImage(imageData) {
    // Atnaujinti DOM su nauju paveikslu, bet neišsaugoti į serverį
    currentImageItem.find('img').attr('src', imageData);
    currentImageItem.find('img').attr('data-edited', 'true');
    currentImageItem.attr('data-edited-src', imageData);
}