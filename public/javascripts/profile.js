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

    const removeFavoriteButtons = document.querySelectorAll('.remove-favorite');
    for (const removeFavBtn of removeFavoriteButtons){
      removeFavBtn.addEventListener('click', handleFavorite)
    }

    function handleFavorite(event){
      const clicked = event.target;
      const action = event.target.className
      const recipeId = clicked.id.split('-');
      fetch(`/recipes/handleFavorite/${recipeId[1]}/${action}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
      })
      .then(response=>{
        if (response.ok){
          const clickable = document.getElementById(clicked.id);
          clickable.previousSibling.remove();
          clickable.remove();
        }
        else{
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      })
    }
    
});