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
    let list = [];

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) console.log(err);

      if (data) {
        const fileData = JSON.parse(data);

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
      } else {
        // create JSON with new user
        list.push(user);
        list = JSON.stringify(list, null, 2);

        fs.writeFile(filePath, list, (err, result) => {
          if (err) console.log(err);
          console.log(result);
        });
      }
    });

    // const token = generateAccessToken({ username: user.username });
    // document.cookie = `token=${token}`;
    // res.json(token);

    res.redirect("/login");
  });

router
  .route("/login")
  .get(function (req, res, next) {
    res.render("login", { title: "Sign In" });
  })
  .post(function (req, res, next) {
    res.render("login", { title: "Sign In" });
  });

router.get("/api/userOrders", authenticateToken, (req, res) => {
  // executes after authenticateToken
  // ...
});

module.exports = router;
