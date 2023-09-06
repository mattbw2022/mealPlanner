document.addEventListener('DOMContentLoaded', () => {
  const randomMeal = document.getElementById('random-meal-btn');
  let clickCount = 0;
  const length = document.getElementsByClassName('meal-card').length;

  randomMeal.addEventListener('click', () => showMeal());
  randomMeal.addEventListener('click', hidePlaceholder);
  function hidePlaceholder(){
    const placeholder = document.getElementById('placeholder');
    placeholder.style.display = 'none';
  }
  function showMeal() {
      const mealCards = document.getElementsByClassName("meal-card");
      
      if (clickCount < length) {
          for (let i = 0; i < length; i++) {
              if (i === clickCount) {
                  mealCards[i].style.display = 'flex';
              } else {
                  mealCards[i].style.display = 'none';
              }
          }
          clickCount++;
      } else {
          // Reset clickCount when the end of the array is reached
          clickCount = 0;
          for (let i = 0; i < length; i++) {
              mealCards[i].style.display = 'none';
          }
          mealCards[0].style.display = 'flex';
      }
  }
});
