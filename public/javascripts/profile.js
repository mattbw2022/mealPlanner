document.addEventListener('DOMContentLoaded', () => {
  
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const hideDeleteAccountBtn = document.getElementById('nvm-btn');
    deleteAccountBtn.addEventListener('click', handleDeleteConfirmation);
    hideDeleteAccountBtn.addEventListener('click', handleDeleteConfirmation )
    function handleDeleteConfirmation() {
      const message = document.getElementById('delete-confirmation-container');
      const background = document.getElementById('background');
      if (message.style.display === 'none' || message.style.display === '') {
        message.style.display = 'flex';
        background.style.display = 'block';
      } else {
        message.style.display = 'none';
        background.style.display = 'none';
      }
    }
    
});