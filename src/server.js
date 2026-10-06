import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authrouter from "./router/user.router.js";
import teamrouter from "./router/team.router.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        Object.assign(new Error("Origin is not allowed"), { statusCode: 403 }),
      );
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/auth", authrouter);
app.use("/api/v1/team", teamrouter);

// app.use(errorMiddleware);

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured");
  }

  await connectDB();

  app.use(notFound);
  app.use(errorHandler);

  const port = Number(process.env.PORT);
  app.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exitCode = 1;
});
