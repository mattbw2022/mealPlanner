document.addEventListener('DOMContentLoaded', ()=> {
    const getQuestionBtn = document.getElementById('get-question-btn');
    document.addEventListener('click', (event)=>{
        const clickedElement = event.target;
        if (getQuestionBtn.id === clickedElement.id){
            verifyUser();
        }
    });
    function verifyUser(){
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;

        fetch('/login/forgotPassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email, username: username}),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            if (response.redirected){
                alert('Email or Username is required to retrieve security question.');
            }
            return response.json();
        })
        .then(data => {
            const question = document.getElementById('security-question-container');
            question.style.display = 'block';
            question.action = `/login/resetPassword/${data.id}`;
            document.getElementById('question').textContent = data.securityQuestion;
        })
    }
})
