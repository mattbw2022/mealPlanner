document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (event) => {
        const clickedElement = event.target;
        if (clickedElement.id === 'show-list-btn'){
            document.getElementById('show-list-btn').style.display = 'none';
            document.getElementById('select-list-container').style.display = 'block';
        }

        if (clickedElement.id === 'add-to-list-btn'){
            const lists = document.getElementById('lists');
            const listId = lists.value;
            const ingredients = document.getElementsByClassName('ingredient')
            const recipeId = window.location.pathname.split('/').pop();

            let ingredientIndexArr = [];
            for (i = 0; i < ingredients.length; i++){
                if (ingredients[i].firstChild.checked){
                    ingredientIndexArr.push(i);
                }
            };
            console.log(ingredientIndexArr);
            fetch(`/lists/addFromRecipe/${listId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ingredientIndexes: ingredientIndexArr, recipeId: recipeId })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                window.location.href = `/lists/list/${listId}`; // Redirect here
            })
            .catch(error => console.error('Error:', error));
            


        }

        if (clickedElement.id === 'select-all-btn'){
            const selectButton = document.getElementById('select-all-btn');
            const ingredients = document.getElementsByClassName('ingredient');
            let text;
            let isChecked;
            console.log(selectButton.textContent);
            if (selectButton.textContent === 'Select All'){
                text = 'Unselect All';
                isChecked = true;
            }
            else{
                text = 'Select All';
                isChecked = false;
            }
            for (let i = 0; i < ingredients.length; i++){
                ingredients[i].firstChild.checked = isChecked;
            }
            selectButton.textContent = text;
        }
    });
});