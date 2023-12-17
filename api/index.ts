import express from "express";
require("dotenv").config();
import list from "./list.json";
import coordinates from "./coordinates.json";
import Player from "../models/player";
import asyncHandler from "express-async-handler";
import cors from "cors";
import morgan from "morgan";
import jwt from "jsonwebtoken";

const app = express();
app.use(
  cors({
    origin: "https://where-s-vader.vercel.app",
    credentials: true,
  })
);

app.use(morgan("dev"));

// mongoose
import mongoose from "mongoose";
import path from "path";

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGO_URL!);
}

// Serve static files
app.use("/api/v1/static", express.static("public"));

// enable JSON body parser
app.use(express.json());

app.post("/api/v1/start", (req, res) => {
  const data: Data = { list: randomThree(list), start: new Date() };
  res.json(jwt.sign(data, process.env.JWT_SECRET!));
});

app.post("/api/v1/capture", (req, res) => {
  const { id, x, y, token } = req.body;
  const data = jwt.verify(token, process.env.JWT_SECRET!) as Data;
  const [{ x1, y1, x2, y2 }] = coordinates.filter((c) => c.id == id);
  // check if in range
  if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
    if (data == undefined) {
      res.status(400).send("Invalid token");
    } else {
      // remove from list
      data.list = data.list.filter((l) => l.id != id);
      if (data.list.length == 0) {
        data.end = new Date();
      }
      // send new data
      res.json(jwt.sign(data, process.env.JWT_SECRET!));
    }
  } else {
    res.status(400).send("Out of range");
  }
});

app.post(
  "/api/v1/submit",
  asyncHandler(async (req, res) => {
    const data = jwt.verify(req.body.token, process.env.JWT_SECRET!) as Data;
    if (!data.start) {
      res.status(400).send("Game did not start");
    } else if (!data.end) {
      res.status(400).send("Game did not end");
    } else {
      // String to date
      data.start = new Date(data.start);
      data.end = new Date(data.end);

      const { name } = req.body;

      const player = new Player({
        name,
        time: data.end.getTime() - data.start.getTime(),
      });
      await player.save();
      res.status(201).send();
    }
  })
);
app.get(
  "/api/v1/leader-board",
  asyncHandler(async (req, res) => {
    const players = await Player.find().sort({ time: 1 });
    res.json(players);
  })
);
export default app;
type Data = {
  name?: string;
  start: Date;
  end?: Date;
  list: Array<{ name: string; id: number; img: string }>;
};

function randomThree(list: Array<{ name: string; id: number; img: string }>) {
  const shuffled = list
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
  return shuffled.slice(0, 3);
}
