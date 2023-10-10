document.addEventListener('DOMContentLoaded', () => {
    const ingredientButton = document.getElementById('add-ingredient');
    const stepButton = document.getElementById('add-step');
    const submitButton = document.getElementById('add-recipe-btn');
    const title = document.getElementById('title');
    const servings = document.getElementById('servings');

    submitButton.addEventListener('click', async (event)=>{
        event.preventDefault();
        let errorFlag = false; 
        if (!title.value){
            errorFlag = true;
            document.getElementById('no-title').style.display = 'block';
            scrollToElement(title.id);
            return;
        }

        await fetch(`/recipes/checkTitle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({title: title.value}),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if(data.duplicate){
                document.getElementById('duplicate-title').style.display = 'block';
                scrollToElement(title.id);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
        
        if (!servings.value){
            errorFlag = true;
            document.getElementById('no-servings').style.display = 'block';
            scrollToElement(servings.id);
        }

        const ingredient = document.getElementsByClassName('ingredient');
        if (IncompleteInputs(ingredient, 'ingredients')){
            errorFlag = true;
        }
        
        const direction = document.getElementsByClassName('step')
        if (IncompleteInputs(direction, 'directions')){
            errorFlag = true;
        }        

        if (errorFlag){
            return;
        }
        if(!errorFlag){
            document.getElementById('newRecipe').submit();
        }
    });

    function IncompleteInputs(inputArr, id){
        const appendee = document.getElementById(id);
        for (let i = 0; i < inputArr.length; i++){
            if(!inputArr[i].value){
                const errorMsg = document.createElement('p');
                const text = document.createTextNode(`Missing ${id} information.`);
                errorMsg.appendChild(text);
                errorMsg.className = 'error-msg';
                errorMsg.style.display = 'block';
                errorMsg.id = `missing-${id}`;
                inputArr[i].style.borderColor = 'red';
                if (appendee.lastChild.className !== 'error-msg'){
                    appendee.append(errorMsg);
                }
                else{
                    appendee.lastChild.style.display = 'block';
                }
                scrollToElement(appendee.parentNode.id);
                return true;
            }
        }
        if(appendee.lastChild.className === 'error-msg'){
            const elementToHide = document.getElementById(appendee.lastChild.id);
            elementToHide.style.display = 'none';
        }
    }

    let ingredientCount = 1;
    ingredientButton.addEventListener('click', () => addRow('ingredient'));
    stepButton.addEventListener('click', () => addRow('direction'));
    
    function addRow(type) {
        const minIngredientMsg = document.getElementById('minIngredientMsg');
        ingredientCount++;
        if (minIngredientMsg){
            minIngredientMsg.remove();
        }
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

function scrollToElement(id) {
    var element = document.getElementById(id);
    var offset = 100;
    var elementPosition = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
    });
}
