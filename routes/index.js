const express = require("express");
const router = express.Router();
const fs = require("fs");
const jwt = require("jsonwebtoken");

router.get("/", function (req, res, next) {
  req.session.views = (req.session.views || 0) + 1;
  res.end(req.session.views + " views");
  res.render("index", { title: "Home" });
});

router
  .route("/register")
  .get(function (req, res, next) {
    res.render("register", { title: "Sign Up", message: req.session.message });
  })
  .post(function (req, res, next) {
    const user = req.body;
    const { username, password } = user;
    const filePath = "./public/data/users.json";

    if (!username || !password) {
      console.log("incorrect username or password");
      req.session.message = "400: Bad Request. Incorrect username or password";
      res.redirect("back");
    }

    // save user token
    const token = jwt.sign(username, process.env.TOKEN_SECRET, {});
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

        console.log("registration successful");
        req.session.message = "Registration successful";
        res.redirect("/login");
      } else {
        const fileData = JSON.parse(data);

        // check if user exists
        const object = fileData.find((obj) => obj.username === username);

        if (object) {
          console.log("user already exists:", object);
          req.session.message = "400: Bad Request. User already exists";
          res.redirect("back");
        } else {
          // add new user
          fileData.push(user);
          const data = JSON.stringify(fileData, null, 2);

          fs.writeFile(filePath, data, (err, result) => {
            if (err) console.log(err);
            console.log(result);
          });

          console.log("registration successful");
          req.session.message = "Registration successful";
          res.redirect("/login");
        }
      }
    });
  });

router
  .route("/login")
  .get(function (req, res, next) {
    res.render("login", { title: "Sign In", message: req.session.message });
  })
  .post(function (req, res, next) {
    const user = req.body;
    const { username, password } = user;
    const filePath = "./public/data/users.json";

    if (!username || !password) {
      console.log("incorrect username or password");
      req.session.message = "400: Bad Request. Incorrect username or password";
      res.redirect("back");
    }

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) console.log(err);

      if (!data) {
        console.log("users' json file is empty or does not exist");
      } else {
        const fileData = JSON.parse(data);

        // check if user exists
        const object = fileData.find((obj) => obj.username === username);

        if (!object) {
          console.log("user not found");
          req.session.message = "400: Bad Request. User not found";
          res.redirect("back");
        } else {
          // compare passwords
          if (object.password != password) {
            console.log("incorrect password");
            req.session.message =
              "400: Bad Request. Incorrect username or password";
            res.redirect("back");
          } else {
            const { token } = object;

            req.headers.authorization = `Bearer ${token}`;
            res.cookie("token", token, {
              httpOnly: true,
              path: "/user",
            });

            // document.cookie = `token=${token}`;
            // req.session.cookies = (req.session.views || 0) + 1;

            console.log("user logged in");
            req.session.message = "User logged in";
            res.redirect("/user");
          }
        }
      }
    });
  });

router.get("/logout", function (req, res) {
  req.session = null;
  res.clearCookie();

  console.log(new Date(), `: user [${req.user}] logged out`);
  res.redirect("/login");
});

router.use("/user", authenticateToken, require("./users"));

// authenticate user token
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : req.cookies.token;
  if (token == null) {
    console.log("token not found");
    req.session.message = "401: Unauthorized. Token not found";
    res.redirect("back");
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    if (err) {
      console.log(err);
      req.session.message = "403: Forbidden. Invalid token";
      res.redirect("back");
    }

    req.user = user;
    console.log({ token, user });
    next();
  });
}

module.exports = router;
