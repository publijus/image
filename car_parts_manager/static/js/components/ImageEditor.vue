<template>
  <div>
    <img :src="imageUrl" alt="Image">
    <button @click="rotateImage('left')">Rotate Left</button>
    <button @click="rotateImage('right')">Rotate Right</button>
    <button @click="adjustImage">Brightness/Contrast</button>
    <button @click="cropImage">Crop</button>
    <button @click="annotateImage">Annotate</button>
    <button @click="saveChanges">Save</button>
    <button @click="$emit('close')">Close</button>
  </div>
</template>

<script>
export default {
  props: ['imageUrl'],
  methods: {
    rotateImage(direction) {
      this.sendEditRequest('rotate', { direction });
    },
    adjustImage() {
      const brightness = prompt('Enter brightness (0.1 to 2):', '1');
      const contrast = prompt('Enter contrast (0.1 to 2):', '1');
      this.sendEditRequest('adjust', { brightness, contrast });
    },
    cropImage() {
      const left = prompt('Enter left:', '0');
      const top = prompt('Enter top:', '0');
      const right = prompt('Enter right:', '100');
      const bottom = prompt('Enter bottom:', '100');
      this.sendEditRequest('crop', { left, top, right, bottom });
    },
    annotateImage() {
      const text = prompt('Enter text to annotate:', 'Sample Text');
      this.sendEditRequest('annotate', { text });
    },
    saveChanges() {
      this.$emit('close');
    },
    sendEditRequest(action, data) {
      const formData = new FormData();
      formData.append('action', action);
      for (const key in data) {
        formData.append(key, data[key]);
      }
      fetch(this.imageUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRFToken': this.getCookie('csrftoken')
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          alert('Image edited successfully');
        } else {
          alert('Failed to edit image');
        }
      });
    },
    getCookie(name) {
      let cookieValue = null;
      if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    }
  }
}
</script>