    // const button = document.getElementById('add-tag-btn');
    // button.addEventListener('click', addTag);
    
    // function addTag(){
    //     const node = document.getElementById("tag-input");
    //     const container = document.getElementById('tag-container');
    //     const clone = node.cloneNode(true);
    //     clone.querySelector('input').value = '';
    //     container.appendChild(clone);
    // }
// Inside your JavaScript code


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


