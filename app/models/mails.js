var db = require('../config/db.js');

exports.send = function (from, toUsername, replyTo, subject, content, done) {
  var values = [from, toUsername, replyTo, subject, content, new Date()];

  db.get()
    .query("INSERT INTO Mails(sender, destination, replied_to, subject, content, date) VALUES (?, (SELECT id FROM Usuarios WHERE username = ? LIMIT 1), ?, ?, ?, ?)",
      values,
      function(err, rows) {
        if (err) {
          done(err);
        } else {
          done(null, {success: true});
        }
      });
};

exports.inbox = function (userId, done) {
  db.get()
    .query("SELECT m.id, m.sender, m.subject, m.content, m.date, u.name, u.username FROM Mails AS m, Usuarios AS u WHERE m.sender = u.id AND destination = ? ORDER BY date DESC",
      userId,
      function(err, rows) {
        if (err) {
          done(err);
        } else {
          done(null, {success:true, mails: mapMails(rows)});
        }
      }
  );
};

// Get one email given it's id. It's locked so that only mails sent to or
// received by an user are shown.
exports.get = function (userId, mailId, done) {
  var values = [userId, userId, mailId];
  db.get()
    .query("SELECT * FROM Mails AS m WHERE (sender = ? OR destination = ?) AND id = ?",
      values,
      function(err, rows) {
        if (err) {
          done(err);
        } else if (rows.length === 0) {
          done(null, {success: false});
        } else {
          done(null, {success: true, mail: mapMail(rows[0])});
        }
      });
};

exports.delete = function (userId, mailId, done) {
  db.get()
    .query("DELETE FROM Mails WHERE destination = ? AND id = ?",
      [userId, mailId],
      function(err, rows) {
        if (err) {
          done(err);
        } else {
          done(null, {success: true});
        }
      });
};

function mapMails(databaseRows) {
  var out = [];
  databaseRows.forEach( function(row) {
    out.push(mapMail(row));
  });
  return out;
}

function mapMail(row) {
  var sender = row.name || row.username || row.sender;
  return {
    id: row.id,
    sender: sender,
    subject: row.subject,
    date: row.date,
    content: row.content
  };
}
