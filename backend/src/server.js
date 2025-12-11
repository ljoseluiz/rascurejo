import app from "./app.js";
import dotenv from "dotenv";
import { startSessionCleanup } from "./lib/auth.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Start session cleanup on server startup
startSessionCleanup();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on port ${PORT}`);
});