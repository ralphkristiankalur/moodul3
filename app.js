const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./database/db");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const { body, validationResult } = require("express-validator");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

const albumValidation = [
  body("title")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Pealkiri on kohustuslik"),

  body("artist")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Artist on kohustuslik"),

  body("genre")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Žanr on kohustuslik"),

  body("year")
    .isInt({ min: 1900, max: 2026 })
    .withMessage("Aasta peab olema korrektne"),

  body("price")
    .isFloat({ min: 0 })
    .withMessage("Hind peab olema positiivne number"),

  body("condition")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Seisukord on kohustuslik"),

  body("image")
    .optional({ checkFalsy: true })
    .trim()
];

/* Public routes */

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/albums", (req, res) => {
  db.all("SELECT * FROM albums ORDER BY id DESC", [], (err, albums) => {
    if (err) {
      return res.send("Albumite laadimisel tekkis viga");
    }

    res.render("albums", { albums });
  });
});

app.get("/detail", (req, res) => {
  res.render("detail");
});

app.get("/detail/:id", (req, res) => {
  db.get("SELECT * FROM albums WHERE id = ?", [req.params.id], (err, album) => {
    if (err || !album) {
      return res.send("Albumit ei leitud");
    }

    res.render("detail", { album });
  });
});

app.get("/kontakt", (req, res) => {
  res.render("kontakt", { success: false });
});

app.post(
  "/kontakt",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Nimi peab olema vähemalt 2 tähemärki"),
    body("email").trim().isEmail().withMessage("Sisesta korrektne e-post"),
    body("message").trim().isLength({ min: 5 }).withMessage("Sõnum peab olema vähemalt 5 tähemärki"),
    body("topic").optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage("Teema on liiga pikk")
  ],
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.send(errors.array()[0].msg);
    }

    const { name, email, topic, message } = req.body;

    db.run(
      `
      INSERT INTO contacts
      (name, email, subject, message)
      VALUES (?, ?, ?, ?)
      `,
      [name, email, topic || "Teemata", message],
      (err) => {
        if (err) {
          return res.send("Sõnumi saatmine ebaõnnestus");
        }

        res.render("kontakt", { success: true });
      }
    );
  }
);

app.get("/ostukorv", (req, res) => {
  res.render("ostukorv");
});

/* Admin login */

app.get("/admin/login", (req, res) => {
  res.render("admin/login");
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err || !user) {
      return res.send("Vale kasutajanimi");
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.send("Vale parool");
    }

    req.session.userId = user.id;
    res.redirect("/admin/dashboard");
  });
});

/* Admin dashboard */

app.get("/admin/dashboard", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/admin/login");
  }

  db.all("SELECT * FROM albums ORDER BY id DESC", [], (err, albums) => {
    if (err) {
      return res.send("Albumite laadimisel tekkis viga");
    }

    res.render("admin/dashboard", { albums });
  });
});

app.get("/admin/messages", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/admin/login");
  }

  db.all("SELECT * FROM contacts ORDER BY created_at DESC", [], (err, messages) => {
    if (err) {
      return res.send("Sõnumite laadimisel tekkis viga");
    }

    res.render("admin/messages", { messages });
  });
});

/* Create album */

app.get("/admin/albums/new", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/admin/login");
  }

  res.render("admin/album-form");
});

app.post("/admin/albums/new", albumValidation, (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/admin/login");
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.send(errors.array()[0].msg);
  }

  const {
    title,
    artist,
    genre,
    year,
    price,
    condition,
    image
  } = req.body;

  db.run(
    `
    INSERT INTO albums
    (title, artist, genre, year, price, condition, image)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [title, artist, genre, year, price, condition, image],
    (err) => {
      if (err) {
        return res.send("Albumi lisamine ebaõnnestus");
      }

      res.redirect("/admin/dashboard");
    }
  );
});

/* Edit album */

app.get("/admin/albums/:id/edit", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/admin/login");
  }

  db.get("SELECT * FROM albums WHERE id = ?", [req.params.id], (err, album) => {
    if (err || !album) {
      return res.send("Albumit ei leitud");
    }

    res.render("admin/edit-album", { album });
  });
});

app.post("/admin/albums/:id/edit", albumValidation, (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/admin/login");
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.send(errors.array()[0].msg);
  }

  const {
    title,
    artist,
    genre,
    year,
    price,
    condition,
    image
  } = req.body;

  db.run(
    `
    UPDATE albums
    SET title = ?,
        artist = ?,
        genre = ?,
        year = ?,
        price = ?,
        condition = ?,
        image = ?
    WHERE id = ?
    `,
    [title, artist, genre, year, price, condition, image, req.params.id],
    (err) => {
      if (err) {
        return res.send("Muutmine ebaõnnestus");
      }

      res.redirect("/admin/dashboard");
    }
  );
});

/* Delete album */

app.post("/admin/albums/:id/delete", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/admin/login");
  }

  db.run("DELETE FROM albums WHERE id = ?", [req.params.id], (err) => {
    if (err) {
      return res.send("Kustutamine ebaõnnestus");
    }

    res.redirect("/admin/dashboard");
  });
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

app.get("/varsti", (req, res) => {
  res.render("varsti");
});