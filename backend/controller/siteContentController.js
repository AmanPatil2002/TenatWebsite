const db = require("../config/db").promise();
const { HttpError, sendError } = require("../utils/tx");
const { tn } = require("../config/provisionSite");
const siteData = require("./siteDataController");

const ID_PATTERN = /^[1-9]\d{0,19}$/;

const isId = (value) =>
  ID_PATTERN.test(String(value ?? "")) &&
  BigInt(value) <= 18446744073709551615n;

// Legacy employees controller consolidated into siteDataController
const getEmployees = async (req, res) => {
  req.params.resource = 'employees';
  return siteData.list(req, res);
};

const createEmployee = async (req, res) => {
  req.params.resource = 'employees';
  return siteData.create(req, res);
};

const updateEmployee = async (req, res) => {
  req.params.resource = 'employees';
  req.params.id = req.params.employeeId;
  return siteData.update(req, res);
};

const deleteEmployee = async (req, res) => {
  req.params.resource = 'employees';
  req.params.id = req.params.employeeId;
  return siteData.remove(req, res);
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
