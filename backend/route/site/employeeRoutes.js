const router = require("express").Router();
const authenticateSiteAdmin = require("../../middleware/authenticateSiteAdmin");
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../../controller/siteContentController");

router.get("/client-admin/:siteId/employees", authenticateSiteAdmin, getEmployees);
router.post("/client-admin/:siteId/employees", authenticateSiteAdmin, createEmployee);
router.put("/client-admin/:siteId/employees/:employeeId", authenticateSiteAdmin, updateEmployee);
router.delete("/client-admin/:siteId/employees/:employeeId", authenticateSiteAdmin, deleteEmployee);

module.exports = router;
