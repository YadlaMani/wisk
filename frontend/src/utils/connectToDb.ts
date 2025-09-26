import mongoose from "mongoose";
import { NextResponse } from "next/server";
const connectToDB = async () => {
  const mongoURL = process.env.MONGO_URL;
  if (!mongoURL) {
    console.log("MONGO_URL not set");
    return NextResponse.json({ error: "MONGO_URL not set" }, { status: 500 });
  }
  mongoose
    .connect(mongoURL)
    .then(() => console.log("Database connected"))
    .catch((err) => console.error("Failed to connect to database", err));
};
export default connectToDB;
