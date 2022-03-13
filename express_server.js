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

function generateRandomString() {
  return Math.random().toString(36).slice(2, 8);
}

const findUserByEmail = (email) => {
  for (const id in users) {
    const user = users[id];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

const urlsForUser = function (userID, urlDatabase) {
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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: false
  };
  
  if (req.cookies.user_id) {
    templateVars[user] = users[req.cookies.user_id];
    res.render("urls_new", templateVars);
  } else {
    res.render("login", templateVars);
  }
});

app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    let templateVars = {
      copy: 'Please login in to add a new URL',
      user: false
    }
    res.status(401);
    res.render("errors", templateVars);
  } else {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    const userID = req.cookies.user_id.id;
    urlDatabase[shortURL] = {
      longURL,
      userID
    }
    res.redirect(`/urls/${tempVar}`);
  }
});

app.get("/urls", (req, res) => {
  const templateVars = {
    user: false
  };
  
  if (req.cookies.user_id) {
    templateVars.user = users[req.cookies.user_id.id];
    templateVars.urls = urlsForUser(req.cookies.user_id.id, urlDatabase);
    console.log(templateVars);
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    let templateVars = {
      copy: 'Error: this link does not exsist!',
      user: false
    }
    res.status(404);
    res.render("errors", templateVars);
  } else if (!req.cookies.user_id || req.cookies.user_id.id !== urlDatabase[req.params.shortURL].userID) {
    res.redirect("/login");
  } else {
      const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies.user_id.id] };
      res.render("urls_show", templateVars);
    }
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    let templateVars = {
      copy: 'Error: this link does not exsist!',
      user: false
    }
    res.status(404);
    res.render("errors", templateVars);
  } else {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.newURL;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: false,
  };
  
  if (req.cookies.user_id) {
    templateVars.user = users[req.cookies.user_id.id];
  }

  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email.trim();
  const password = req.body.password.trim();
  
  if (!email || !password) {
    return res.status(403).send("Invalid credentials");
  }

  const user = findUserByEmail(email);

  if (!user || user.password !== password) {
    return res.status(403).send("Invalid credentials");
  }

  res.cookie("user_id", { id: user.id });

  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: null,
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email.trim();
  const password = req.body.password.trim();
  
  if (!email || !password) {
    return res.status(400).send("Please enter a valid email and password");
  }

  const user = findUserByEmail(email);
  
  if (user) {
    return res.status(400).send("Account already exsists");
  }

  users[id] = {
    id,
    email,
    password
  };
  res.cookie('user_id', { id });
  res.redirect("/urls");
});