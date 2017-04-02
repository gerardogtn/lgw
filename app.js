var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');

var handlebars = require('express-handlebars').create({
       defaultLayout:'main',
       layoutsDir: path.join(__dirname, 'app', 'views', 'layouts'),
       helpers: {
           section: function(name, options){
               if(!this._sections) this._sections = {};
               this._sections[name] = options.fn(this);
               return null;
}}});

var app = express();

// Set up database
// var db = require('./app/config/db.js');
// db.connect(function(err) {
//   if (err) {
//     console.log('Unable to connect to MySQL.');
//     process.exit(1);
//   }
// });

// Set port.
app.set('port', process.env.PORT || 3000);

// Set up logger.
app.use(logger('dev'));

// Set up handlebars
app.set('views', path.join(__dirname, 'app', 'views'));
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// Set up body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up cookie parser
// var credentials = require('./app/config/credentials.js');
// app.use(cookieParser(credentials.cookieSecret));
// app.use(expressSession());

// Set public directory.
app.use(express.static(path.join(__dirname, 'public')));


// Error handling
app.use(function(req, res, next) {
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  error = {};
  if (app.get('env') === 'development') {
    console.log(err);
    error = err;
  }
  res.render('500', {
    message: err.message,
    error: error
  });
});


app.listen(app.get('port'), function() {
  console.log('Express started on http://localhost:' +
  app.get('port') + ";\n press Ctrl-C to terminate.");
});

module.exports = app;
