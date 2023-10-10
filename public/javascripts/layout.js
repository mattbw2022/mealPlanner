document.addEventListener('DOMContentLoaded', ()=>{

    const dropdownBtn = document.getElementById('dropdown-btn');
    dropdownBtn.addEventListener('click', ()=>{
        const nav = document.getElementById('main-nav');
        if (nav.firstChild.style.display === 'none' || nav.firstChild.style.display === ''){
            nav.style.display === 'flex'
            for (let i = 0; i < nav.childNodes.length; i++){
                nav.childNodes[i].style.display = 'block';
            }
        }
        else{
            for (let i = 0; i < nav.childNodes.length; i++){
                nav.childNodes[i].style.display = 'none';
            }
        }
        
    });

    document.addEventListener('click', (event) =>{
        const clickedElement = event.target;
        const screenWidth = document.documentElement.clientWidth || document.body.clientWidth;
        const elementId = event.target.id;
        const mainNav = document.getElementById('main-nav');
        if (elementId !== 'dropdown-btn' && (mainNav.firstChild.display !== 'none' || mainNav.firstChild.display !== '') && screenWidth < 1011){
            for (let i = 0; i < mainNav.childNodes.length; i++){
                mainNav.childNodes[i].style.display = 'none';
            }
        }
    })


    function trackScreenSize() {
        const screenWidth = document.documentElement.clientWidth || document.body.clientWidth;
        const dropdownBtn = document.getElementById('dropdown-btn');
        const nav = document.getElementById('main-nav');
        if (screenWidth < 1011){
            dropdownBtn.style.display = 'block';
            if (nav.firstChild.style.display !== 'none' || nav.firstChild.style.display !=='');
            for (let i = 0; i < nav.childNodes.length; i++){
                nav.childNodes[i].style.display = 'none';
            }
        }
        else{
            dropdownBtn.style.display = 'none';
            for (let i = 0; i < nav.childNodes.length; i++){
                nav.childNodes[i].style.display = 'block';
            }
        }
    }
    
    trackScreenSize();
    
    window.addEventListener('resize', trackScreenSize);

});

  