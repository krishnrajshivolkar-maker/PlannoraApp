const express = require("express");

const router = express.Router();

const freelancerRequestController = require("../controllers/freelancerrequest.controller");

// Accept a request
router.post("/:requestId/accept", freelancerRequestController.acceptRequest);

// Reject a request
router.post("/:requestId/reject", freelancerRequestController.rejectRequest);

// Submit attendance code
router.post("/:requestId/attendance", freelancerRequestController.submitAttendance);

// Submit redflag code
router.post("/:requestId/redflag", freelancerRequestController.submitRedflag);

module.exports = router;
