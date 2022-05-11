const express = require("express");
const { body } = require("express-validator");
const { createWeb } = require("../controllers/web.controller");
const { loginRequired } = require("../middlewares/authentication");
const { validate } = require("../middlewares/validator");
const router = express.Router();

router.post(
  "/create",
  validate([
    body("name", "Invalid name").exists().notEmpty(),
    body("url", "Invalid url").exists().notEmpty(),
    body("template", "Invalid template").exists().notEmpty(),
    body("range", "Invalid range").exists().notEmpty(),
  ]),
  loginRequired,
  createWeb
);

// const { name, url, template, range } = req.body;
module.exports = router;