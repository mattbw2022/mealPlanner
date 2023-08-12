var createError = require('http-errors');
require('dotenv').config();
var express = require('express');
var path = require('path');
var logger = require('morgan');
var session = require('express-session');
var store = new session.MemoryStore();
var LocalStrategy = require('passport-local').Strategy;
var app = express();
var passport = require('passport');
const queries = require('./queries');
const helper = require('./helper');
const flash = require('connect-flash');


app.use(passport.initialize());
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  queries.findUserById(id, function (err, user) {
    if (err) return done(err);
    done(null, user);  
  });
}
);

passport.use(new LocalStrategy(
  function(email, password, done){
    queries.findUserByEmail(email, (err, user) =>{
      if (err){
        return done(err);
      }
      if (!user){
        return done(null, false);
      }
      if (user.password != password){
        return done(null, false);
      }
      return done(null, user);
    });
  }
))


app.use(session({
  secret: "D53gxl41G", // Secret used to sign the session ID cookie
  cookie: {
    maxAge: 172800000, // 2 days in milliseconds
    secure: process.env.NODE_ENV === 'production', // Set to true in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,    // Only accessible through HTTP(S) requests
  },
  resave: false,
  saveUninitialized: false,
  store: store,
}));

app.use(flash());

app.use(helper.isLoggedIn);
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var mealsRouter = require('./routes/meals');
var profileRouter = require('./routes/profile');
var calendarRouter = require('./routes/calendar');
var loginRouter = require('./routes/login');
var registerRouter = require('./routes/register');
var logoutRouter = require('./routes/logout');



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/profile', profileRouter);
app.use('/users', usersRouter);
app.use('/meals', mealsRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/calendar', calendarRouter);
app.use('/logout', logoutRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
