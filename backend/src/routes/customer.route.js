const express = require("express");

const router = express.Router();

const customerController = require("../controllers/customer.controller");

// Create customer account
router.post("/create", customerController.createCustomer);

// Get customer account
router.get("/", customerController.getCustomer);

// Update customer account
router.put("/update", customerController.updateCustomer);

// Delete customer account
router.delete("/delete", customerController.deleteCustomer);

module.exports = router;
