var express = require("express");
var router = express.Router();

router.get("/", function (req, res, next) {
  res.render("welcome", {
    title: "Dashboard",
    user: req.user,
    message: req.session.message,
  });
});

module.exports = router;
