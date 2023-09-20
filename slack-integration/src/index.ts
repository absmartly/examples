import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.post("/", (req, res) => {
  console.log(req.body);
  res.status(200).send();
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
