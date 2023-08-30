document.addEventListener('DOMContentLoaded', () => {


    const editButton = document.getElementById('edit-img-btn');
    editButton.addEventListener('click', showInput);
    
    function showInput() {
      const form = document.getElementById('meal-card');
      // Toggle the display property of the filter container
      if (form.style.display === 'none' || form.style.display === '') {
        form.style.display = 'block';
      } else {
        form.style.display = 'none';
        button.style.display = 'none';
      }
    }
    
});