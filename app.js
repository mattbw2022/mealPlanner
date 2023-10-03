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
const pool = require('./connection');
const {getDate} = require('./calendar');
const query = require('./queries');
// const helmet = require('helmet');
// app.use(helmet());

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
var recipesRouter = require('./routes/recipes');
var listsRouter = require('./routes/lists');
var profileRouter = require('./routes/profile');
var calendarRouter = require('./routes/calendar');
var loginRouter = require('./routes/login');
var registerRouter = require('./routes/register');
var logoutRouter = require('./routes/logout');
const { check } = require('express-validator');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/profile', profileRouter);
app.use('/recipes', recipesRouter);
app.use('/lists', listsRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/calendar', calendarRouter);
app.use('/logout', logoutRouter);

console.log(Date.now('July 20, 69 00:20:18'));
const checkDate = new Date();
checkDate.setMilliseconds();
console.log(checkDate.getMilliseconds());
setInterval(async () => {
  const date = getDate(helper.createTimestamp(Date.now()));
  const addDate = date.year + 1;
  const userIdAdditionQuery = await pool.query(
  `SELECT DISTINCT user_id 
  FROM calendars 
  WHERE user_id NOT IN (
      SELECT DISTINCT user_id 
      FROM calendars 
      WHERE year = $1);`, [addDate]);
  const userIdAdditions = userIdAdditionQuery.rows;
  if (userIdAdditions.length >= 1){
    try {
      for (let i = 0; i < userIdAdditions.length; i++){ 
        query.updateCalendars(date.year, userIdAdditions[i]);
      }
    } catch (error) {
      console.error('Error executing query:', error);
    }
  }
  else{
    console.log('No calendar additions needed.');
  }
  const deleteDate = date.year - 2;
  const userIdDeletionQuery = await pool.query(
    `SELECT DISTINCT user_id 
    FROM calendars 
    WHERE user_id IN (
        SELECT DISTINCT user_id 
        FROM calendars 
        WHERE year = $1);`, [deleteDate]
  )
  const userIdDeletes = userIdDeletionQuery.rows;
  if (userIdDeletes.length >= 1){
    try {
      for (let i = 0; i < userIdDeletes.length; i++){ 
        pool.query('DELETE FROM calendars WHERE user_id = $1 AND year = $2', [userIdDeletes[i], deleteDate]);
      }
    } catch (error) {
      console.error('Error executing query:', error);
    }
  }
  else{
    console.log('No calendar deletetions needed.');
  }
}, 86400000);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;