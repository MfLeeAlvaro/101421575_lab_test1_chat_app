/*
 * Auth routes - signup and login
 * Jon Adrian Lee - 101421575
 */

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

// POST /api/signup - create new user
router.post("/signup", async (req, res) => {
  try {
    const { username, firstname, lastname, password } = req.body;

    // make sure all fields are filled in
    if (!username || !firstname || !lastname || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // check if username is taken
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      firstname,
      lastname,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        createdon: user.createdon,
      },
    });
  } catch (err) {
    // handle duplicate key error from mongoose (just in case)
    if (err.code === 11000) {
      return res.status(409).json({ error: "Username already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/login - authenticate user
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // find user in db
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // compare password with hashed version
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // create jwt token
    const token = jwt.sign({ username: user.username }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      message: "Login successful",
      username: user.username,
      firstname: user.firstname,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
