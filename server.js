const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const express = require("express");
const expressSession = require("express-session");
const mongo = require("mongodb");
const app = express();
const PORT = 5000;
const db_user = "databaseuser"; //Your database account username
const db_pass = "databaseuser"; //Your database account password
const db_name = "PingPongDatabase"; //Your database
const account_collection = "PingPongAccounts"; //Collection of your account database
const trial_account_pool = "TrialAccountPool"; //Collection of pre-made trial accounts
const db_url = `mongodb://${db_user}:${db_pass}@localhost:27017/${db_name}`;
let database;
const SALT_ROUNDS = 10; //Number of rounds the password will be salted using bcrypt

const message ={}; //Message object for giving error and successful completion messages

mongo.connect(db_url, { useNewUrlParser: true }, (err, db) => {
  if (err) throw err;
  database = db.db(db_name);
});

app.use(bodyParser.json()); app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressSession({
  name: "myCookie",
  resave: false,
  saveUninitialized: false,
  rolling: true,
  secret: "mySecret",
  cookie: {
      sameSite: true,
      secure: false
  },
}));
app.use("/css", express.static(__dirname + "/css"));

app.set('views', './pages');
app.set('view engine', 'ejs');

//Middleware for email validation
const validateEmail = (req,res,next) => {
  const {email} = req.body;
  console.log(email.split("@").length)
  if (email.split("@").length !== 2) {
    message.notValidEmail = "Email address is not valid!";
    console.log("Email address is not valid!");
    return res.redirect("/register");
  }
  next();
}

//Middleware redirect to the login page
const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect("/login");
  } else {
    next();
  }
}

//Middleware redirect to the main page. Will be used if the user is logged in.
const redirectMain = (req, res, next) => {
  if (req.session.userId) {
    res.redirect("/mainpage");
  } else {
    next();
  }
}

//Routes

app.get("/", redirectMain, (req, res) => {
  res.render("home");
});

app.get("/home", redirectMain, (req, res) => {
  res.render("home");
});

app.get("/login", redirectMain, (req, res) => {
  res.render("login");
});

app.get("/register", redirectMain, (req, res) => {
  res.render("register");
});

app.get("/trialaccount", (req, res) => {
  res.render("trialaccount");
});

app.get("/mainpage", redirectLogin, (req, res) => {
  res.render("mainpage");
});

app.get("/profile", redirectLogin, (req, res) => {
  res.render("profile");
});

app.get("/game", redirectLogin, (req, res) => {
  res.render("game");
});

//Register a USER account
app.post("/u_register", validateEmail, (req, res) => {
  const { email, username, password } = req.body;
  database.collection(account_collection).find({ $or: [{ username: username }, { email: email }] }).toArray((err, users) => {
    if (err) throw err;
    if (users.length > 0) {
      if (users.find(u => u.username === username)) {
        message.usernameUsed = "Username is already used!";
        console.log("Username is already used!");
      }
      if (users.find(u => u.email === email)) {
        message.emailUsed = "Email is already used!";
        console.log("Email is already used!");
      }
      res.redirect("/register");
    }
    else {
      bcrypt.hash(password, SALT_ROUNDS, (err, pwd) => {
        if (err) throw err;
        database.collection(account_collection).insertOne({
          username: username,
          email: email,
          password: pwd,
        });
        message.userCreationSuccessful = "User created successfully!"
        console.log("User created successfully!");
        res.redirect("/register");
      });
    }
  });
});

//Login with a USER account
app.post("/u_login", (req, res) => {
  const { username, password } = req.body;
  database.collection(account_collection).findOne({ username: username }, (err, user) => {
    if (err) throw err;
    if (user) {
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) throw err;
        if (result) {
          req.session.userId = user._id;
          req.session.username = user.username;
          res.redirect("/mainpage");
        } else {
          message.incorrectPassword = "Incorrect password!";
          console.log("Incorrect password!");
          res.redirect("/login");
        }
      });
    } else {
      message.noSuchUser = "User doesn't exist!";
      console.log("User doesn't exist!");
      res.redirect("/login");
    }
  });
});

//Generate and register a TRIAL account. Notice that the generated username will be compared to ALL existing usernames, irrespective of whether they are trial accounts or user accounts.
app.post("/t_register", (req, res) => {
  const { trial_username_to_generate, trial_password_to_generate } = req.body;
  database.collection(account_collection).find({ username: trial_username_to_generate }).toArray((err, users) => {
    if (err) throw err;
    if (users.length > 0) {
      if (users.find(u => u.username === trial_username_to_generate)) {
        console.log("Username is already used!");
      }
      res.redirect("/register");
    }
    else {
      bcrypt.hash(trial_password_to_generate, SALT_ROUNDS, (err, pwd) => {
        if (err) throw err;
        database.collection(account_collection).insertOne({
          username: trial_username_to_generate,
          password: pwd,
          expireAt: new Date(Date.now() + 1 * 24*3600*1000),
        });
        console.log("Trial account created!");
        res.render("trialaccount", { trial_u: trial_username_to_generate, trial_p: trial_password_to_generate });
      });
    }
  });
});

//TRIAL account login for the first time. Notice that this is not a mandatory way to log in (a faster way, though). You can also use a normal login page, if you want.
app.post("/t_login", (req, res) => {
  const { t_username, t_password} = req.body;
  console.log(t_username, t_password);
  database.collection(account_collection).findOne({ username: t_username }, (err, user) => {
    if (err) throw err;
    if (user) {
      bcrypt.compare(t_password, user.password, (err, result) => {
        if (err) throw err;
        if (result) {
          req.session.userId = user._id;
          req.session.username = user.username;
          res.redirect("/mainpage");
        } else {
          console.log("Incorrect password!");
          res.redirect("/login");
        }
      });
    } else {
      console.log("User doesn't exist!");
      res.redirect("/login");
    }
  });
});

//Going to game screen!
app.post("/game", (req, res) => {
  res.redirect("/game");
});

//Going from game to mainpage
app.post("/submitgame", (req, res) => {
  res.redirect("/mainpage");
});

//Logout
app.post("/logout", (req, res) => {
  req.session.destroy (err => {
    if (err) return res.redirect("/mainpage");
    res.clearCookie("myCookie");
    res.redirect("/login");
  });
});

app.listen(PORT);
console.log("Listening to port: " + PORT);