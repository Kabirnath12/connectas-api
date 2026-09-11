import "dotenv/config";

import app from "./app";

const PORT = Number(process.env.PORT) || 5000;

console.log("JWT_SECRET loaded:", Boolean(process.env.JWT_SECRET));

app.listen(PORT, () => {
  console.log(`ConnectAS API running on http://localhost:${PORT}`);
});