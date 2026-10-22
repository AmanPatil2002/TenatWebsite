const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const cors = require("cors");

const authRoute = require("./route/authRoute");
const reviewRoute = require("./route/reviewRoute");
const categoryRoute = require("./route/categoryRoute");
const templateRoute = require("./route/templateRoute");
const paymentRoute = require("./route/paymentRoute");
const siteRoute = require("./route/siteRoute");
const pageRoute = require("./route/pageRoute");
const themeRoute = require("./route/themeRoute");
const publicRoute = require("./route/publicRoute");

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/auth", authRoute);
app.use("/review", reviewRoute);
app.use("/categories", categoryRoute);
app.use("/templates", templateRoute);
app.use("/payments", paymentRoute);
// siteRoute, pageRoute, themeRoute all mount under /site but with different patterns.
// pageRoute uses /site/:siteId/pages, themeRoute uses /site/:siteId/themes —
// they don't collide with siteRoute's /site and /site/:siteId.
app.use("/site", siteRoute);
app.use("/site", pageRoute);
app.use("/site", themeRoute);
app.use("/public", publicRoute);

app.get("/health", (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server Running on Port ${PORT}`));