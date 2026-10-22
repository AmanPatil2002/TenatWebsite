const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticate");
const { getAcontact,postAcontact,deleteAcontact } = require("../controller/acontactController");

router.get("/acontact", getAcontact);
router.post("/acontact", authenticateToken, postAcontact);
router.delete("/acontact/:acontactId", authenticateToken, deleteAcontact);

module.exports = router;