
document.addEventListener('DOMContentLoaded', () => {
    // const button = document.getElementById('add-tag-btn');
    // button.addEventListener('click', addTag);
    const help = document.getElementsByClassName('help');
    help.addEventListener('onmouseover', showHelp);

    // function addTag(){
    //     const node = document.getElementById("tag-input");
    //     const container = document.getElementById('tag-container');
    //     const clone = node.cloneNode(true);
    //     clone.querySelector('input').value = '';
    //     container.appendChild(clone);
    // }

    function showHelp(){
        document.getElementsByClassName('help-label').style.display = 'block';
    }
});