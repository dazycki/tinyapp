// SEARCH DATABASE FOR USER AND RETURN AS OBJECT
const getUserByEmail = function(email, database) {
  for (let key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
  return undefined;
};

// GENERATE A RANDOM 6 DIGIT LONG ALPHANUMERIC CODE
const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};

// FETCH THE URLS THAT MATCH THE USER'S ID
const urlsForUser = function(userID, urlDatabase) {
  let urls = {};
  for (let shortURL of Object.keys(urlDatabase)) {
    if (urlDatabase[shortURL].userID === userID) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };