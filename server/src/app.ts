import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import incidentRoutes from "./routes/incidentRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Incident Portal API is running",
  });
});

export default app;
