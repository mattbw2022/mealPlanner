
function isLoggedIn(req, res, next) {
    res.locals.authenticated = req.session.authenticated || false;
    next();
  }

function ensureAuthentication(req, res, next){
  if(!req.session.authenticated){
    res.redirect('/login')
  }
  next();
}

  
function checkPasswordStrength(password){
  if (password.length < 12){

  }
  let caps = 0;
  let nums = 0;
  const specialChars = "`~!@#$%^&*()_+-=/?.>,<:;|"
  let special = 0;
  for (let i = 0; i < password.length; i++){
      
      for (let j = 0; j < specialChars.length; j++){
          if(password[i] == specialChars[j]){
              special++;
              break;
          }
      }

      if (password[i] >= 'A' && password[i] <= 'Z') {
          caps++;
      }

      if (password[i] >= '0' && password[i] <= '9'){
          nums++;
      }
  }
  if (caps >= 1 && nums >=1 && special >=1){
      return true;
  }
  else return false;
}

  module.exports = {
    isLoggedIn: isLoggedIn,
    checkPasswordStrength: checkPasswordStrength,
    ensureAuthentication: ensureAuthentication
  }