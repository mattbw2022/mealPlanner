document.addEventListener('DOMContentLoaded', () => {
    const securityQuestion = document.getElementById('security-question');
    document.addEventListener('click', (event)=> {
        const clickedElement = event.target;
        const selectedOption = securityQuestion.options[securityQuestion.selectedIndex].value;
        const customQuestion = document.getElementById('custom-question');
        const hideCustomBtn = document.getElementById('hide-custom-btn');
        if (selectedOption === 'create-question'){
            customQuestion.style.display = 'block';
            hideCustomBtn.style.display = 'block';
            securityQuestion.style.display = 'none';
        }
        if (clickedElement.id === hideCustomBtn.id){
            customQuestion.style.display = 'none';
            hideCustomBtn.style.display = 'none';
            securityQuestion.style.display = 'block';
            securityQuestion.selectedIndex = 0;
        }
        
    });
});