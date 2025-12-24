import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import codeVersionRoutes from "./routes/codeVersionRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";
import comparisonRoutes from "./routes/comparisonRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Allow larger payloads for code

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mount routes - All under /api prefix for consistency
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/versions", codeVersionRoutes);
app.use("/api/analyses", analysisRoutes);
app.use("/api/comparisons", comparisonRoutes);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
