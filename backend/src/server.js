import app from "./app.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on port ${PORT}`);
});