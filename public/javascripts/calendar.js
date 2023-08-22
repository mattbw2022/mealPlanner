  document.addEventListener('DOMContentLoaded', () => {
    const expandButtons = document.querySelectorAll('.expand-btn');
    
    for (const expandButton of expandButtons) {
        expandButton.addEventListener('click', expandInformation);
    }
    
    function expandInformation(event) {
        const clickedButton = event.currentTarget;
        const mealListId = clickedButton.dataset.mealList; // Get the associated meal list ID from data attribute
        const mealList = document.getElementById(mealListId);
        console.log(mealList);
        
        if (mealList) {
            if (mealList.style.display === 'none' || mealList.style.display === '') {
                mealList.style.display = 'flex';
            } else {
                mealList.style.display = 'none';
            }
        }
    }
});