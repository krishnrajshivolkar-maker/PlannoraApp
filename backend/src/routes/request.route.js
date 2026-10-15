const express = require("express");

const router = express.Router();

const requestController = require("../controllers/request.controller");

// Create request
router.post("/create", requestController.createRequest);

// Get all requests by logged-in customer
router.get("/", requestController.getRequests);

// Get one request by ID
router.get("/:id", requestController.getRequestById);

// Update request
router.put("/:id", requestController.updateRequest);

// Delete request
router.delete("/:id", requestController.deleteRequest);

// Remove a freelancer from accepted list (customer action)
router.delete("/:requestId/freelancer/:freelancerId", requestController.removeFreelancerFromAccepted);

module.exports = router;
