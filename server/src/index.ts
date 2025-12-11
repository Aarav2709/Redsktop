import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import proxyRouter from "./routes/proxy.js";
import { apiRateLimit } from "./middleware/rateLimit.js";
import { config } from "./config.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));
app.use(apiRateLimit);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", proxyRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error" });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}

export default app;
