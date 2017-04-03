var db = require('../config/db.js');

exports.create = function (name, username, password, done) {
  var values = [name, username, password];
  db.get()
    .query("INSERT INTO Usuarios (name, username, password) VALUES(?, ?, ?)",
      values,
      function(err, result) {
        if (err && err.code == 'ER_DUP_ENTRY') {
          done(null, {success: false, msg: "Username already taken."});
        } else if (err) {
          done(err);
        } else {
          done(null, {success: true});
        }
      });
};

exports.checkUsername = function (username, done) {
  db.get()
    .query("SELECT username FROM Usuarios WHERE username = ?",
      username,
      function(err, rows) {
        if (err) {
          done(err);
        } else {
          done(null, {success: true, available: rows.length === 0});
        }
      });
};

exports.getByUsernameAndPassword = function (username, password, done) {
  var values = [username, password];
  db.get()
    .query("SELECT * FROM Usuarios WHERE username = ? AND password = ?",
      values,
      function(err, rows) {
        if (err) {
          done(err);
        } else if(rows.length === 0) {
          done(null, {success: false, msg: "Incorrect username or password"});
        } else {
          var result = rows[0];
          done(null, {success: true, user: {
            id: result.id,
            name: result.name,
            username: result.username
          }});
        }
      });
};

exports.delete = function (username, password, done) {
  var values = [username, password];
  db.get()
    .query("DELETE FROM Usuarios WHERE username = ? AND password = ?",
      values,
      function(err, results) {
        if(err) {
          done(err);
        } else {
          done(null, {success: true});
        }
      }
  );
};
