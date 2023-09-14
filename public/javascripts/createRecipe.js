document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('nan-msg').style.display = 'none';
    const ingredientButton = document.getElementById('add-ingredient');
    const stepButton = document.getElementById('add-step');

    ingredientButton.addEventListener('click', () => addRow('ingredient'));
    stepButton.addEventListener('click', () => addRow('direction'));

    function addRow(type) {
        const node = document.getElementById(`${type}-container`);
        const clone = node.cloneNode(true);

        const inputFields = clone.querySelectorAll('input[type="text"]');
        inputFields.forEach(input => {
            input.value = '';
        });

        const containerId = `${type}s`;
        document.getElementById(containerId).appendChild(clone);
    }

    document.addEventListener('input', (event) => {
        if (event.target.matches('.quantity')) {
            const quantity = event.target.value;
            const nanMessage = document.getElementById('nan-msg');
            
            if (!isNaN(quantity)) {
                nanMessage.style.display = 'none';
                document.getElementsByClassName('quantity').style.backgroundColor = 'red';
            } else {
                nanMessage.style.display = 'block';
            }
        }
    });
});
