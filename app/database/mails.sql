CREATE TABLE Mails(
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  sender INTEGER NOT NULL,
  destination INTEGER NOT NULL,
  replied_to INTEGER,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATETIME NOT NULL,

  CONSTRAINT fk_sender FOREIGN KEY (sender) REFERENCES Usuarios(id),
  CONSTRAINT fk_destination FOREIGN KEY (destination) REFERENCES Usuarios(id),
  CONSTRAINT fk_replied_to FOREIGN KEY (replied_to) REFERENCES Mails(id)
);
