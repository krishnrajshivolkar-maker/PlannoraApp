const express = require("express");

const router = express.Router();

const freelancerController = require("../controllers/freelancer.controller");

// Create freelancer account
router.post("/create", freelancerController.createFreelancer);

// Get freelancer account
router.get("/", freelancerController.getFreelancer);

// Update freelancer account
router.put("/update", freelancerController.updateFreelancer);

// Delete freelancer account
router.delete("/delete", freelancerController.deleteFreelancer);

module.exports = router;
