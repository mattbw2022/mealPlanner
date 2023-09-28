
function activeFiltersCheck(tagId) {
  if (options.activeFilters && options.activeFilters.includes(tagId)) {
      return true;
  }
  return false;
}

document.addEventListener('DOMContentLoaded', () => {

    const addMealButtons = document.querySelectorAll('.addMeal-btn');
    for (const button of addMealButtons) {
        button.addEventListener('click', prepAddMeal);
    }
    function prepAddMeal(event) {
        const button = event.target;
        const form = button.nextElementSibling;
        form.style.display = 'grid';
        button.style.display = 'none';
    }

    const filterButton = document.getElementById('filter-btn');
    filterButton.addEventListener('click', toggleFilters);
    
    function toggleFilters(event) {
      const div = document.getElementById('filter-container');
      
      if (div.style.display === 'none' || div.style.display === '') {
        div.style.display = 'flex';
      } else {
        div.style.display = 'none';
      }
    }

    
});


