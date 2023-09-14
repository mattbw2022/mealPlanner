document.addEventListener('DOMContentLoaded', () => {
  const randomrecipe = document.getElementById('random-recipe-btn');
  let clickCount = 0;
  const length = document.getElementsByClassName('recipe-card').length;

  randomrecipe.addEventListener('click', () => showrecipe());
  randomrecipe.addEventListener('click', hidePlaceholder);
  function hidePlaceholder(){
    const placeholder = document.getElementById('placeholder');
    placeholder.style.display = 'none';
  }
  function showrecipe() {
      const recipeCards = document.getElementsByClassName("recipe-card");
      
      if (clickCount < length) {
          for (let i = 0; i < length; i++) {
              if (i === clickCount) {
                  recipeCards[i].style.display = 'flex';
              } else {
                  recipeCards[i].style.display = 'none';
              }
          }
          clickCount++;
      } else {
          // Reset clickCount when the end of the array is reached
          clickCount = 0;
          for (let i = 0; i < length; i++) {
              recipeCards[i].style.display = 'none';
          }
          recipeCards[0].style.display = 'flex';
      }
  }
});
