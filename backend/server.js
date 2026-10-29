require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const ckeditorUploadRoute = require("./route/ckeditorUploadRoute");
const authRoute = require("./route/authRoute");
const reviewRoute = require("./route/reviewRoute");
const categoryRoute = require("./route/categoryRoute");
const templateRoute = require("./route/templateRoute");
const paymentRoute = require("./route/paymentRoute");
const siteRoute = require("./route/siteRoute");
const pageRoute = require("./route/pageRoute");
const themeRoute = require("./route/themeRoute");
const faqRoute = require("./route/faqRoute");
const acontactRoute = require("./route/acontactRoute");
const statsRoute = require("./route/statsRoutes");

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((s) => s.trim())
  : true;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "10mb" }));

app.use("/auth", authRoute);
app.use("/review", reviewRoute);
app.use("/categories", categoryRoute);
app.use("/templates", templateRoute);
app.use("/payments", paymentRoute);
app.use("/sites", siteRoute);
app.use("/pages", pageRoute);
app.use("/theme", themeRoute);
app.use("/faq", faqRoute);
app.use("/contact", acontactRoute);
app.use("/stats", statsRoute);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", ckeditorUploadRoute);

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body too large" });
  }
  console.error(err);
  return res.status(500).json({ message: err.message || "Server error" });
});

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});