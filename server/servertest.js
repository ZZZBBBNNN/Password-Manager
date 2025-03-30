const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());


// 接收前端 GET 请求
app.get('/', async (req, res) => {
  const name = req.query.Name; // 获取查询参数
  if (!name) {
    return res.status(400).send("Name 参数缺失");
  }

  try {
    console.log(name);
    res.send({ message: "Name successfully stored!", name });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});



app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
