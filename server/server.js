const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'test_db',
});

app.get('/', async (req, res) => {
  const name = req.query.Name;
  if (!name) {
    return res.status(400).send("Name 参数缺失");
  }

  try {
    await db.query("INSERT INTO names (name) VALUES (?)", [name]);
    res.send({ message: "Name successfully stored!", name });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get('/init', async (req, res) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS names (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL
      );
    `);
    res.send("Database and Table Initialized");
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
}); 
