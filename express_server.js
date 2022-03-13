const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};

const findUserByEmail = function(email) {
  for (const id in users) {
    const user = users[id];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

const urlsForUser = function(userID, urlDatabase) {
  let urls = {};
  for (let shortURL of Object.keys(urlDatabase)) {
    if (urlDatabase[shortURL].userID === userID) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

/* CLEANED UP FUNCTIONS!!!! */

// END POINT TO SERVER CREATE A NEW TINY URL PAGE
app.get("/urls/new", (req, res) => {
  const templateVars = {};
  
  if (req.cookies.user_id) {
    templateVars.user = users[req.cookies.user_id.id];
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// END POINT TO CREATE A NEW TINY URL
app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) { // CHECK IF USER IS SIGNED IN
    res.redirect("/login");
  } else {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    const userID = req.cookies.user_id.id;
    urlDatabase[shortURL] = {
      longURL,
      userID
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

// END POINT TO SERVE URLS INDEX/ HOME PAGE
app.get("/urls", (req, res) => {
  if (req.cookies.user_id) { // CHECK IF USER IS SIGNED IN
    const templateVars = {
      user: users[req.cookies.user_id.id],
      urls: urlsForUser(req.cookies.user_id.id, urlDatabase) // FETCH USER'S URLS
    }
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

// END POINT TO LOAD SPECIFIC URL'S PAGE 
app.get("/urls/:shortURL", (req, res) => {
  if (req.cookies.user_id) { // CHECK IF USER IS SIGNED IN
    if (!urlDatabase[req.params.shortURL]) { // CHECK IF TINY URL IS IN DATABASE
      let templateVars = {
        copy: 'Error: this link does not exsist!',
        user: req.cookies.user_id.id
      };
      res.status(404);
      res.render("errors", templateVars);
    } else if (req.cookies.user_id.id === urlDatabase[req.params.shortURL].userID) { // CHECK IF URL BELONGS TO USER
      const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies.user_id.id] };
      res.render("urls_show", templateVars);
    } 
  } else {
    res.redirect("/login")
  }
});

// END POINT TO REDIRECT USER FROM TINY URL TO ACTUAL URL
app.get("/u/:shortURL", (req, res) => {  
  if (!urlDatabase[req.params.shortURL]) { // CHECK IF TINY URL IS IN DATABASE
    const templateVars = {
      copy: 'Error: this link does not exsist!',
    };
    if (req.cookies.user_id) { // PASS THROUGH USER ID IF SIGNED IN
      templateVars.user = users[req.cookies.user_id.id];
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
  if (!req.cookies.user_id) { // CHECK IF USER IS SIGNED
    res.redirect("/login");
  } else if (req.cookies.user_id.id !== urlDatabase[req.params.shortURL].userID) {  // CONDITION IF URL DOES NOT BELONG TO USER 
    let templateVars = {
      copy: 'Error: you do not have permission to perform this action!',
      user: req.cookies.user_id.id
    };
    res.status(401);
    res.render("errors", templateVars);
  } else if (req.cookies.user_id.id === urlDatabase[shortURL].userID) { // CONDITION IF URL DOES BELONG TO USER
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

// END POINT TO UPDATE TINY URL 
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!req.cookies.user_id) { // CHECK IF USER IS LOGGED IN
    res.redirect("/login")
  } else if (req.cookies.user_id.id === urlDatabase[shortURL].userID) { // CHECK IF URL BELONGS TO USER
    urlDatabase[shortURL].longURL = req.body.newURL;
    res.redirect("/urls");
  } else {
    let templateVars = {
      copy: 'Error: you do not have permission to perform this action!',
      user: req.cookies.user_id.id
    };
    res.status(401);
    res.render("errors", templateVars);
  }
});

// END POINT TO SERVE PAGE
app.get("/login", (req, res) => {
  const templateVars = {
    user: undefined // SET USER AS UNDEFINED UNTIL LOGGED IN
  };
  if (req.cookies.user_id) { // CHECK IF USER IS LOGGED IN
    templateVars.user = users[req.cookies.user_id.id];
  }
  res.render("login", templateVars);
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

  const user = findUserByEmail(email);

  if (!user || user.password !== password) { // CHECK IF INPUT MATCHES PASSWORD IN DATABASE
    let templateVars = {
      copy: 'Error: invalid credentials!',
      user: undefined
    };
    res.status(403);
    res.render("errors", templateVars);
  }

  res.cookie("user_id", { id: user.id });
  res.redirect("/urls");
});

// END POINT TO LOGOUT USER AND CLEAR USERID COOKIE
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
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
  
  if (!email || !password) { //CHECK IF EMAIL AND PASSWORD ARE FILLED IN
    let templateVars = {
      copy: 'Error: please enter a valid email and password!',
      user: undefined
    };
    res.status(400);
    res.render("errors", templateVars);
  }

  const user = findUserByEmail(email);
  
  if (user) { //CHECK IF USER ALREADY EXSISTS IN DATABASE
    let templateVars = {
      copy: 'Error: account already exsists, please login instead!',
      user: undefined
    };
    res.status(400);
    res.render("errors", templateVars);
  }

  users[id] = {
    id,
    email,
    password
  };
  res.cookie('user_id', { id });
  res.redirect("/urls");
});



