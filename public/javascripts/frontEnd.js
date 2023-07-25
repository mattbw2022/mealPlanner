
document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('addRow');
    button.addEventListener('click', addIngredient);

    function addRow() {
        const newField = document.createElement("input");
        document.getElementById('newMeal').insertBefore(newField, button);
    }

    function addIngredient(){
        const node = document.getElementById("ingredient-container");
        const clone = node.cloneNode(true);

        document.getElementById('ingredients').appendChild(clone);
    }
});