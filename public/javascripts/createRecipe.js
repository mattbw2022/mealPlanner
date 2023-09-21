document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('nan-msg').style.display = 'none';
    const ingredientButton = document.getElementById('add-ingredient');
    const stepButton = document.getElementById('add-step');
    let ingredientCount = 1;
    
    ingredientButton.addEventListener('click', () => addRow('ingredient'));
    stepButton.addEventListener('click', () => addRow('direction'));
    
    function addRow(type) {
        const minIngredientMsg = document.getElementById('minIngredientMsg')
        ingredientCount++;
        if (minIngredientMsg){
            minIngredientMsg.remove();
        }
        console.log(ingredientCount);
        const node = document.getElementById(`${type}-container`);
        const clone = node.cloneNode(true);

        const inputFields = clone.querySelectorAll('input[type="text"]');
        inputFields.forEach(input => {
            input.value = '';
        });

        const containerId = `${type}s`;
        document.getElementById(containerId).appendChild(clone);
    }

    document.addEventListener('click', (event) =>{
        const clickedElement = event.target;
        if (clickedElement.className === 'remove-ingredient' && ingredientCount > 1){
            const parentNode = event.target.parentNode;
            parentNode.remove();
            ingredientCount--;
        }
        else if(clickedElement.className === 'remove-ingredient' && ingredientCount === 1){
            if(!document.getElementById('minIngredientMsg')){
                const minIngredientsElem = document.createElement('p');
                const text = document.createTextNode('At lease one ingredient is required.');
                minIngredientsElem.appendChild(text);
                minIngredientsElem.style.color = 'red';
                minIngredientsElem.id = 'minIngredientMsg';
                clickedElement.parentNode.appendChild(minIngredientsElem)
            }
        }
    });

});
