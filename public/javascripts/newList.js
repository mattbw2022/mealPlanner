document.addEventListener('DOMContentLoaded', () => {
    const itemButton = document.getElementById('add-item');
    let itemCount = 1;
    itemButton.addEventListener('click', () => addRow('item'));
    
    function addRow(type) {
        if (itemCount === 0){
            document.getElementById('item-container').style.display = 'flex';
            itemCount++;
            return;
        }
        itemCount++;
        const node = document.getElementById(`${type}-container`);
        const minItemMsg = document.getElementById('min-item-msg')
        if (minItemMsg){
            minItemMsg.remove();
        }
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
        if (clickedElement.className === 'remove-item' && itemCount > 1){
            const parentNode = event.target.parentNode;
            parentNode.remove();
            itemCount--;
        }
        else if(clickedElement.className === 'remove-item' && itemCount === 1){
            // if(!document.getElementById('min-item-msg')){
            //     const minItemsElm = document.createElement('p');
            //     const text = document.createTextNode('Empty items will not be added to your list.');
            //     minItemsElm.appendChild(text);
            //     minItemsElm.style.color = 'red';
            //     minItemsElm.id = 'min-item-msg';
            //     clickedElement.parentNode.parentNode.append(minItemsElm)
            // }
            const elementToHide = document.getElementById('item-container');
            elementToHide.style.display = 'none';
            itemCount--;
        }
    });
});
