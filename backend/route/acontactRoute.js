const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticate");
const { getAcontact,postAcontact,updateAcontact,deleteAcontact } = require("../controller/acontactController");

router.get("/acontact", getAcontact);
router.post("/acontact", authenticateToken, postAcontact);
router.put("/acontact/:acontactId", authenticateToken, updateAcontact);
router.delete("/acontact/:acontactId", authenticateToken, deleteAcontact);

module.exports = router;