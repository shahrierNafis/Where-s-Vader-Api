const express = require("express");
const session = require("express-session");

const app = express();

// enable JSON body parser
app.use(express.json());

app.use("/api", (req, res, next) => {
  res.sent("Hello, World!");
});

export default app;
