const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./database/db");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false
  })
);

app.use(express.static(path.join(__dirname, "public")));

/* Public routes */

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/albums", (req, res) => {
  res.render("albums");
});

app.get("/detail", (req, res) => {
  res.render("detail");
});

app.get("/kontakt", (req, res) => {
  res.render("kontakt");
});

app.get("/ostukorv", (req, res) => {
  res.render("ostukorv");
});

/* Admin login */

app.get("/admin/login", (req, res) => {
  res.render("admin/login");
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err || !user) {
        return res.send("Vale kasutajanimi");
      }

      const match = await bcrypt.compare(
        password,
        user.password
      );

      if (!match) {
        return res.send("Vale parool");
      }

      req.session.userId = user.id;

      res.redirect("/admin/dashboard");
    }
  );
});

/* Admin dashboard */

app.get("/admin/dashboard", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/admin/login");
  }

  res.send("Admin töötab!");
});

/* Logout */

app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

app.listen(PORT, () => {
  console.log(`Server töötab: http://localhost:${PORT}`);
});