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

/* =========================================================
   CORS CONFIGURATION
========================================================= */

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://connectas.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an origin
      // Example: Postman, curl, server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],

    exposedHeaders: ["Content-Length"],

    optionsSuccessStatus: 204,
  })
);

// Explicitly handle preflight requests


/* =========================================================
   BODY PARSERS
========================================================= */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   BASIC ROUTES
========================================================= */

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "ConnectAS API is running",
    platform: "ConnectAS",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "ConnectAS API healthy",
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   API ROUTES
========================================================= */

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
app.use("/api/jobs", jobsRoutes);

/* =========================================================
   404 HANDLER
========================================================= */

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (
    error: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Global API error:", error);

    if (error.message === "Not allowed by CORS") {
      return res.status(403).json({
        success: false,
        message: "CORS origin not allowed",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

export default app;