  document.addEventListener('DOMContentLoaded', () => {
    const expandButtons = document.querySelectorAll('.expand-btn');
    
    for (const expandButton of expandButtons) {
        expandButton.addEventListener('click', expandInformation);
    }
    
    function expandInformation(event) {
        const clickedButton = event.currentTarget;
        const reccipeListId = clickedButton.dataset.reccipeList; // Get the associated reccipe list ID from data attribute
        const reccipeList = document.getElementById(reccipeListId);
        
        if (reccipeList) {
            if (reccipeList.style.display === 'none' || reccipeList.style.display === '') {
                reccipeList.style.display = 'flex';
            } else {
                reccipeList.style.display = 'none';
            }
        }
    }

    const changeRecipeButtons = document.querySelectorAll('.move-recipe-btn');
    for (const button of changeRecipeButtons) {
        button.addEventListener('click', prepMoveRecipe);
    }
    function prepMoveRecipe(event) {
        const button = event.target;
        const form = button.nextElementSibling;
        form.style.display = 'flex';
        button.style.display = 'none';
    }
});