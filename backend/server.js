require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoute = require("./route/authRoute");
const reviewRoute = require("./route/reviewRoute");
const categoryRoute = require("./route/categoryRoute");
const templateRoute = require("./route/templateRoute");
const paymentRoute = require("./route/paymentRoute");
const refundRoute = require("./route/refundRoute");
const siteRoute = require("./route/siteRoute");
const pageRoute = require("./route/pageRoute");
const themeRoute = require("./route/themeRoute");
const siteMenuRoute = require("./route/siteMenuRoute");
const faqRoute = require("./route/faqRoute");
const acontactRoute = require("./route/acontactRoute");

const app = express();

// CLIENT_URL can be a single origin or a comma-separated list, e.g.
// CLIENT_URL=https://myapp.com,https://admin.myapp.com
// If it is not set (local development), all origins are allowed.
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((s) => s.trim())
  : true;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "5mb" }));

app.use("/auth", authRoute);
app.use("/review", reviewRoute);
app.use("/categories", categoryRoute);
app.use("/templates", templateRoute);
app.use("/payments", paymentRoute);
app.use("/refunds", refundRoute);
// siteRoute, pageRoute, themeRoute all mount under /site but with different patterns.
// pageRoute uses /site/:siteId/pages, themeRoute uses /site/:siteId/themes —
// they don't collide with siteRoute's /site and /site/:siteId.
app.use("/site", siteRoute);
app.use("/site", pageRoute);
app.use("/site", themeRoute);
app.use("/site", siteMenuRoute);
app.use("/faq", faqRoute);
app.use("/contact", acontactRoute);

// 404 handler: must come after all routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler: must be last, and must have 4 arguments
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Malformed JSON body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }
  // Body larger than the 5mb limit
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body too large" });
  }
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server Running on Port ${PORT}`));