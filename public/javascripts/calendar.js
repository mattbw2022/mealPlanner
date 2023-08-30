  document.addEventListener('DOMContentLoaded', () => {
    const expandButtons = document.querySelectorAll('.expand-btn');
    
    for (const expandButton of expandButtons) {
        expandButton.addEventListener('click', expandInformation);
    }
    
    function expandInformation(event) {
        const clickedButton = event.currentTarget;
        const mealListId = clickedButton.dataset.mealList; // Get the associated meal list ID from data attribute
        const mealList = document.getElementById(mealListId);
        
        if (mealList) {
            if (mealList.style.display === 'none' || mealList.style.display === '') {
                mealList.style.display = 'flex';
            } else {
                mealList.style.display = 'none';
            }
        }
    }

    const changeMealButtons = document.querySelectorAll('.move-meal-btn');
    for (const button of changeMealButtons) {
        button.addEventListener('click', prepMoveMeal);
    }
    function prepMoveMeal(event) {
        const button = event.target;
        const form = button.nextElementSibling;
        form.style.display = 'flex';
        button.style.display = 'none';
    }
});