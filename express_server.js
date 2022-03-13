const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session')
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['userID']
}));

app.set('view engine', 'ejs');

const urlDatabase = {};
const users = {};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

/* CLEANED UP FUNCTIONS!!!! */

// END POINT TO SERVER CREATE A NEW TINY URL PAGE
app.get("/urls/new", (req, res) => {
  const templateVars = {};
  
  if (req.session.userID) {
    templateVars.user = users[req.session.userID];
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// END POINT TO CREATE A NEW TINY URL
app.post("/urls", (req, res) => {
  if (!req.session.userID) { // CHECK IF USER IS SIGNED IN
    res.redirect("/login");
  } else {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    const userID = req.session.userID;
    urlDatabase[shortURL] = {
      longURL,
      userID
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

// END POINT TO SERVE URLS INDEX/ HOME PAGE
app.get("/urls", (req, res) => {
  if (req.session.userID) { // CHECK IF USER IS SIGNED IN
    const templateVars = {
      user: users[req.session.userID],
      urls: urlsForUser(req.session.userID, urlDatabase) // FETCH USER'S URLS
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

// END POINT TO LOAD SPECIFIC URL'S PAGE
app.get("/urls/:shortURL", (req, res) => {
  if (req.session.userID) { // CHECK IF USER IS SIGNED IN
    if (!urlDatabase[req.params.shortURL]) { // CHECK IF TINY URL IS IN DATABASE
      let templateVars = {
        copy: 'Error: this link does not exsist!',
        user: req.session.userID
      };
      res.status(404);
      res.render("errors", templateVars);
    } else if (req.session.userID === urlDatabase[req.params.shortURL].userID) { // CHECK IF URL BELONGS TO USER
      const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.userID] };
      res.render("urls_show", templateVars);
    }
  } else {
    res.redirect("/login");
  }
});

// END POINT TO REDIRECT USER FROM TINY URL TO ACTUAL URL
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) { // CHECK IF TINY URL IS IN DATABASE
    const templateVars = {
      copy: 'Error: this link does not exsist!',
    };
    if (req.session.userID) { // PASS THROUGH USER ID IF SIGNED IN
      templateVars.user = users[req.session.userID];
    }
    res.status(404);
    res.render("errors", templateVars);
  } else {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  }
});

// END POINT TO DELETE A URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!req.session.userID) { // CHECK IF USER IS SIGNED
    res.redirect("/login");
  } else if (req.session.userID !== urlDatabase[req.params.shortURL].userID) {  // CONDITION IF URL DOES NOT BELONG TO USER
    let templateVars = {
      copy: 'Error: you do not have permission to perform this action!',
      user: req.session.userID
    };
    res.status(401);
    res.render("errors", templateVars);
  } else if (req.session.userID === urlDatabase[shortURL].userID) { // CONDITION IF URL DOES BELONG TO USER
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

// END POINT TO UPDATE TINY URL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!req.session.userID) { // CHECK IF USER IS LOGGED IN
    res.redirect("/login");
  } else if (req.session.userID === urlDatabase[shortURL].userID) { // CHECK IF URL BELONGS TO USER
    urlDatabase[shortURL].longURL = req.body.newURL;
    res.redirect("/urls");
  } else {
    let templateVars = {
      copy: 'Error: you do not have permission to perform this action!',
      user: req.session.userID
    };
    res.status(401);
    res.render("errors", templateVars);
  }
});

// END POINT TO SERVE PAGE
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session.userID]
  };
  if (templateVars.user) {
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});

// END POINT TO LOGIN USER
app.post("/login", (req, res) => {
  const email = req.body.email.trim();
  const password = req.body.password.trim();

  if (!email || !password) { //CHECK IF EMAIL AND PASSWORD ARE FILLED IN
    let templateVars = {
      copy: 'Error: invalid credentials!',
      user: undefined
    };
    res.status(403);
    res.render("errors", templateVars);
  }

  const user = getUserByEmail(email, users);

  if (!user) { // CHECK IF USER EXSISTS IN DATABASE
    let templateVars = {
      copy: 'Error: invalid credentials!',
      user: undefined
    };
    res.status(403);
    res.render("errors", templateVars);
  } 
  
  if (!bcrypt.compareSync(password, user.hashedPassword)) { // CHECK IF INPUT MATCHES PASSWORD IN DATABASE
    let templateVars = {
      copy: 'Error: invalid credentials!',
      user: undefined
    };
    res.status(403);
    res.render("errors", templateVars);
  }

  req.session.userID = user.id;
  res.redirect("/urls");
});

// END POINT TO LOGOUT USER AND CLEAR USERID COOKIE
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//END POINT TO SERVER REGISTER PAGE
app.get("/register", (req, res) => {
  const templateVars = {
    user: undefined,
  };
  res.render("register", templateVars);
});

// END POINT TO ADD NEW USER TO DATABASE
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email.trim();
  const password = req.body.password.trim();
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) { //CHECK IF EMAIL AND PASSWORD ARE FILLED IN
    let templateVars = {
      copy: 'Error: please enter a valid email and password!',
      user: undefined
    };
    res.status(400);
    res.render("errors", templateVars);
  }

  const user = getUserByEmail(email, users);
  
  if (user) { //CHECK IF USER ALREADY EXSISTS IN DATABASE
    let templateVars = {
      copy: 'Error: account already exsists, please login instead!',
      user: undefined
    };
    res.status(400);
    res.render("errors", templateVars);
  }

  // CREATE NEW USER IF ABOVE CHECKS PASS
  users[id] = {
    id,
    email,
    hashedPassword
  };

  req.session.userID = id;
  res.redirect("/urls");
});



