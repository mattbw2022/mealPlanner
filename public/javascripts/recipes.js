
function activeFiltersCheck(tagId) {
  if (options.activeFilters && options.activeFilters.includes(tagId)) {
      return true;
  }
  return false;
}

document.addEventListener('DOMContentLoaded', () => {

    const addRecipeButtons = document.querySelectorAll('.addRecipe-btn');
    const whiteCalendars = document.querySelectorAll('.white-calendar');
    const addFavoriteButtons = document.querySelectorAll('.add-favorite');
    const removeFavoriteButtons = document.querySelectorAll('.remove-favorite');
    for (const removeFavBtn of removeFavoriteButtons){
      removeFavBtn.addEventListener('click', handleFavorite)
    }
    for (const favoriteBtn of addFavoriteButtons){
        favoriteBtn.addEventListener('click', handleFavorite)
    }
    for (const calendar of whiteCalendars){
      calendar.addEventListener('mouseover', swapCalendarImg);
    }
    for (const button of addRecipeButtons) {
        document.getElementById(button.id).style.display = 'none';
        button.addEventListener('click', prepAddRecipe);
        button.addEventListener('mouseleave', swapCalendarImg);
    }

    function handleFavorite(event){
      const clicked = event.target;
      const action = event.target.className
      const recipeId = clicked.parentElement.id;
      fetch(`/recipes/handleFavorite/${recipeId}/${action}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
      })
      .then(response=>{
        if (response.ok){
          const clickable = document.getElementById(clicked.id);
          if (action === 'add-favorite'){
            clickable.className = 'remove-favorite';
            clickable.src = '/images/full-star.png';
          }
          else{
            clickable.className = 'add-favorite';
            clickable.src = '/images/empty-star.png';
          }
        }
        else{
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      })  
    }
    function prepAddRecipe(event) {
        const button = event.target;
        const formId = button.id.split('-')
        const otherButton = document.getElementById(`white-${formId[1]}`);
        const form = document.getElementById(`form-${formId[1]}`);
        form.style.display = 'grid';
        button.style.display = 'none';
        otherButton.style.display = 'none';
    }

    function swapCalendarImg(event){
      const id = event.target.id;
      const index = id[(id.length - 1)]
      const whiteCalendar = document.getElementById(`white-${index}`);
      const goldCalendar = document.getElementById(`gold-${index}`); 
      if (event.type === 'mouseover'){ 
        whiteCalendar.style.display = 'none';
        goldCalendar.style.display = 'grid';
      }
      if(event.type === 'mouseleave' && goldCalendar.style.display === 'grid'){
        whiteCalendar.style.display = 'grid';
        goldCalendar.style.display = 'none';
      }
    }

    const filterButton = document.getElementById('filter-btn');
    filterButton.addEventListener('click', toggleFilters);
    
    function toggleFilters() {
      const div = document.getElementById('filter-container');
      const button = document.getElementById('apply-filters-btn');
      // Toggle the display property of the filter container
      if (div.style.display === 'none' || div.style.display === '') {
        div.style.display = 'flex';
        button.style.display = 'flex';
      } else {
        div.style.display = 'none';
        button.style.display = 'none';
      }
    }
    
});


