import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import clientRoutes from "./routes/clientRoutes";
import projectRoutes from "./routes/projectRoutes";
import taskRoutes from "./routes/taskRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

function isAllowedOrigin(origin: string) {
  if (origin === frontendUrl) return true;

  // A Vercel preview URL appends a deployment suffix to the project hostname,
  // e.g. app-abc123.vercel.app. Permit previews only for this same project.
  try {
    const configuredUrl = new URL(frontendUrl);
    const requestUrl = new URL(origin);
    const vercelSuffix = ".vercel.app";

    if (!configuredUrl.hostname.endsWith(vercelSuffix)) return false;

    const projectHost = configuredUrl.hostname.slice(0, -vercelSuffix.length);
    return (
      requestUrl.protocol === configuredUrl.protocol &&
      requestUrl.hostname.endsWith(vercelSuffix) &&
      (requestUrl.hostname === configuredUrl.hostname ||
        requestUrl.hostname.startsWith(`${projectHost}-`))
    );
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (health checks, server-to-server)
      // do not need a browser CORS decision.
      if (!origin || isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Keep the error handler last so it catches anything passed to next(err)
app.use(errorHandler);

export default app;
