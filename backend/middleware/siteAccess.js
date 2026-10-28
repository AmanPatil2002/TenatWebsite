
// Only platform-admin guard is needed today. The old per-site admin query
// referenced a non-existent `admin` table; removed.

const requirePlatformAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

module.exports = { requirePlatformAdmin };