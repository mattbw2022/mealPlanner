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
            nav.style.display === 'none';
            for (let i = 0; i < nav.childNodes.length; i++){
                nav.childNodes[i].style.display = 'none';
            }
        }
        
    });
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    if (screenWidth < 1011){
        dropdownBtn.style.display = 'block';
    }
    function trackScreenSize() {
        const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
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

  