import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  name: String,
  time: Number,
});
export default mongoose.model("Player", playerSchema);
