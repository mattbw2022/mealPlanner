document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (event) => {
        const clickedElement = event.target;

        if (clickedElement.className === 'remove-item-btn') {
            const targetElement = document.getElementById(clickedElement.id);
            console.log(targetElement);
            const itemId = clickedElement.id.split('-')[1];
            const parent = targetElement.parentNode;
            const itemCount = document.getElementsByClassName(parent.className);
            const listId = window.location.pathname.split('/').pop();
            
            fetch(`/lists/list/${listId}/removeItem/${itemId}`, {
                method: 'POST',
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if(itemCount.length > 1){
                    targetElement.parentNode.remove();
                    targetElement.previousSibling.remove();
                    targetElement.remove();
                }
                else{
                   const lastItem = document.getElementsByClassName('item-container');
                   lastItem[0].style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });

            return;
        }
        if (clickedElement.id === 'new-item-btn'){
            const newItemBtn = document.getElementById(clickedElement.id);
            const newItemInput = document.getElementById('new-item-container');
            const addItemBtn = document.getElementById('add-item-btn');
            newItemBtn.style.display = 'none';
            newItemInput.style.display = 'flex';
            addItemBtn.style.display = 'block';
        }
        if (clickedElement.id === 'add-item-btn'){
            const listId = window.location.pathname.split('/').pop();
            const qty = document.getElementsByClassName('quantity');
            const unit = document.getElementsByClassName('unit');
            const item = document.getElementsByClassName('item');
            fetch(`/lists/list/${listId}/addItem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ item: item[0].value, quantity: qty[0].value, unit: unit[0].value }),
            
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                if (response.redirected){
                    alert('Item is required to add to a list.');
                }
                return response.json();
            })
            .then(data => {
                const items = document.getElementsByClassName('item-container');
                if (items.length > 1 || (items.length === 1 && items[0].style.display === 'flex')){
                    let clone;
                    for (let i = 0; i < items.length; i++){
                        if (items[i].hasChildNodes()){
                            clone = items[i].cloneNode(true);
                        }    
                    }
                    clone.firstChild.id = `item-${items.length}`;
                    clone.lastChild.id = `delete-${items.length}`;
                    const elementsToIterate = clone.firstChild.firstChild;
                    for (let i = 0; i < elementsToIterate.childNodes.length; i++){
                        elementsToIterate.childNodes[i].textContent = data.newItemArr[i];
                        elementsToIterate.childNodes[i].id = `item-${items.length}`;
                    }
                    document.getElementById('list').appendChild(clone);
                }
                else{
                    const elementsToIterate = items[0].firstChild.firstChild;
                    for (let i = 0; i < elementsToIterate.childNodes.length; i++){
                        elementsToIterate.childNodes[i].textContent = data.newItemArr[i];
                    }
                    items[0].style.display = 'flex';
                }

            })
            .catch(error => {
                console.error('Error:', error);
            });
            return;

        }

        const elementToCheck = document.getElementById(clickedElement.id)
        let crosslistener = false;
        elementToCheck.classList.forEach(element => {
            if (element === 'cross-off-listener'){
                crosslistener = true;
            }
        });
        if (crosslistener){ 
            const targetElement = document.getElementById(clickedElement.id);
            if (targetElement.classList.length === 2) {
                targetElement.classList.add('crossed-off');
            }
            else {
                targetElement.classList.remove('crossed-off');
            }
            const itemId = clickedElement.id.split('-')[1]; // Extract item ID
            const listId = window.location.pathname.split('/').pop();
            
            // Send a POST request to your server to update isCrossed
            fetch(`/lists/list/${listId}/crossOffItem/${itemId}`, {
                method: 'POST',
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    
    });
});
