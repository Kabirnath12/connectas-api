import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import postRoutes from "./routes/post.routes";
import collaborationRoutes from "./routes/collaboration.routes";
import socialRoutes from "./routes/social.routes";
import friendRoutes from "./routes/friend.routes";
import notificationRoutes from "./routes/notification.routes";
import messageRoutes from "./routes/message.routes";
import discoverRoutes from "./routes/discover.routes";
import platformRoutes from "./routes/platform.routes";
import recommendationRoutes from "./routes/recommendation.routes";
import jobsRoutes from "./routes/jobs.routes";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Root health response
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "ConnectAS API is running",
  });
});

// API health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "ConnectAS API healthy",
  });
});

// Application routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/collaborations", collaborationRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/discover", discoverRoutes);
app.use("/api/platform", platformRoutes);
app.use("/api/recommendations", recommendationRoutes);

// Jobs aggregator routes
app.use("/api/jobs", jobsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Global error handler
app.use(
  (
    error: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Global API error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

export default app;