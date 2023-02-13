var express = require("express");
var router = express.Router();
const fs = require("fs");
const jwt = require("jsonwebtoken");

function generateAccessToken(username) {
  return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: "1800s" });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    console.log(err);
    if (err) return res.sendStatus(403);

    req.user = user;
    next();
  });
}

router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router
  .route("/register")
  .get(function (req, res, next) {
    res.render("register", { title: "Sign Up" });
  })
  .post(function (req, res, next) {
    const user = req.body;
    const filePath = "./public/data/users.json";

    // save user token
    const token = generateAccessToken({ username: user.username });
    // document.cookie = `token=${token}`;
    user.token = token;

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) console.log(err);

      if (!data) {
        // create JSON file with new user
        const list = [];

        list.push(user);
        const data = JSON.stringify(list, null, 2);

        fs.writeFile(filePath, data, (err, result) => {
          if (err) console.log(err);
          console.log(result);
        });
      } else {
        const fileData = JSON.parse(data);

        // check if user exists
        const object = fileData.find((obj) => obj.username === user.username);

        if (object) {
          console.log("user already exists:", object);
        } else {
          // add new user
          fileData.push(user);
          const data = JSON.stringify(fileData, null, 2);

          fs.writeFile(filePath, data, (err, result) => {
            if (err) console.log(err);
            console.log(result);
          });
        }
      }
    });

    res.redirect("/login");
  });

router
  .route("/login")
  .get(function (req, res, next) {
    res.render("login", { title: "Sign In" });
  })
  .post(function (req, res, next) {
    const user = req.body;
    const filePath = "./public/data/users.json";

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) console.log(err);

      if (!data) {
        console.log("users' json file is empty or does not exist");
      } else {
        const fileData = JSON.parse(data);

        // check if user exists
        const object = fileData.find((obj) => obj.username === user.username);

        if (!object) {
          console.log("user not found");
        } else {
          // compare passwords
          if (object.password != user.password) {
            console.log("incorrect password");
          } else {
            console.log("user logged in");

            res.redirect("/user");
          }
        }
      }
    });
  });

router.use("/user", authenticateToken, require("./users"));

module.exports = router;
