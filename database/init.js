const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("./db");

const schemaPath = path.join(__dirname, "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");

db.exec(schema, async (err) => {
  if (err) {
    console.error("Schema error:", err.message);
    return;
  }

  const username = "admin";
  const plainPassword = "admin123";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  db.run(
    "INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)",
    [username, hashedPassword],
    (err) => {
      if (err) {
        console.error("Admin user error:", err.message);
      } else {
        console.log("Andmebaas loodud");
        console.log("Admin kasutaja: admin");
        console.log("Admin parool: admin123");
      }

      db.close();
    }
  );
});