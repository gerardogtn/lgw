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
var db = require('./app/config/db.js');
db.connect(function(err) {
  if (err) {
    console.log('Unable to connect to MySQL.');
    process.exit(1);
  }
});

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
var credentials = require('./app/config/credentials.js');
app.use(cookieParser(credentials.cookieSecret));
app.use(expressSession());

// Set public directory.
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.render('index', {title: "Bienvenido"});
});

app.get('/login', function(req, res) {
  res.render('login', {title: "Login"});
});

app.get('/signup', function(req, res) {
  res.render('signup', {title: "Sign up"});
});

var emailModel = require('./app/models/mails');
var userModel = require('./app/models/users.js');

app.get('/inbox', function(req, res, next) {
  emailModel.inbox(req.session.user.id, function(err, response) {
    if (err) {
      next(err);
    } else if (response.success) {
      res.render('inbox', {
        layout: 'logged_in',
        title: "Inbox",
        emails: response.mails,
        user: req.session.user
      });
    } else {
      next("We couldn't load your emails, please try again later.");
    }
  });
});

app.get('/mail', function(req, res, next) {
  emailModel.get(req.session.user.id, req.query.id, function(err, result) {
    if (err) {
      next(err);
    } else if (!result.success) {
      next();
    } else {
      res.render('mail', {
        layout: 'logged_in',
        title: result.mail.subject,
        email: result.mail,
        user: req.session.user
      });
    }
  });
});

app.get('/compose', function(req, res) {
  res.render('compose', {
    layout: 'logged_in',
    title: "New mail",
    user: req.session.user
  });
});

// Data API
app.post('/api/v1/user', function(req, res, next) {
  var name = req.body.name;
  var username = req.body.username;
  var password = req.body.password;
  if (name && username && password) {
    userModel.create(name, username, password, function(err, response) {
      if (err) {
        next(err);
      } else {
        res.send(response);
      }
    });
  } else {
    res.send({success: false, msg:"Name, username, or password are not defined"});
  }
});

app.delete('/api/v1/user', function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  if (username && password) {
    userModel.delete(username, password, function(err, response) {
      if (err) {
        next(err);
      } else {
        res.send(response);
      }
    });
  } else {
    res.send({success: false, msg: "Missing username or password"});
  }
});

app.post('/api/v1/username/available', function(req, res) {
  var username = req.body.username;
  if (username) {
    userModel.checkUsername(username, function(err, response) {
      if (err) {
        next(err);
      } else {
        res.send(response);
      }
    });
  } else {
    res.send({success:false, msg: "Missing username"});
  }
});

app.post('/api/v1/login', function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  if (username && password) {
    userModel.getByUsernameAndPassword(username, password, function(err, response) {
      if (err) {
        next(err);
      } else {
        req.session.user = response.user;
        res.send(response);
      }
    });
  } else {
    res.send({success: false, msg: "Missing username or password"});
  }
});

app.post('/api/v1/logout', function(req, res, next) {
  req.session = null;
  res.send({success: true});
});

app.post('/api/v1/mail', function(req, res, next) {
  var sender = req.session.user.id;
  var destinationUsername = req.body.receiver;
  var repliedTo = (req.body.repliedTo === '' || req.body.repliedTo) ? null : req.body.repliedTo;
  var subject = req.body.subject;
  var content = req.body.content;

  if (sender && destinationUsername && subject && content) {
    emailModel.send(sender, destinationUsername, repliedTo, subject, content, function(err, response) {
      if (err) {
        next(err);
      } else {
        res.send(response);
      }
    });
  } else {
    res.send({success: false, msg: "Missing sender, destination, subject, or content"});
  }
});

app.get('/api/v1/mail', function(req, res, next) {
  var userId = req.query.userId;
  var mailId = req.query.mailId;

  if (userId && mailId) {
    emailModel.get(userId, mailId, function(err, result) {
      if (err) {
        next(err);
      } else {
        res.send(result);
      }
    });
  } else {
    res.send({success: false, msg: "Missing user id or mail id"});
  }
});

app.get('/api/v1/inbox', function(req, res, next) {
  var userId = req.query.userId;

  if (userId) {
    emailModel.inbox(userId, function(err, result) {
      if (err) {
        next(err);
      } else {
        res.send(result);
      }
    });
  } else {
    res.send({success: false, msg:"Missing user id"});
  }
});

app.delete('/api/v1/mail', function(req, res, next) {
  var userId = req.session.user.id;
  var mailId = req.body.mailId;
  if (userId && mailId) {
    emailModel.delete(userId, mailId, function(err, result) {
      if (err) {
        next(err);
      } else {
        res.send(result);
      }
    });
  } else {
    res.send({success: false, msg:"Missing user or mail id"});
  }
});

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
  console.log(
    'Express started on http://localhost:' +
    app.get('port') +
    ";\n press Ctrl-C to terminate."
  );
});

module.exports = app;
