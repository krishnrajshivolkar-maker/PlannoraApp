const express = require("express");

const router = express.Router();

const authcontroller = require("../controllers/auth.controller");
const ratelimiter = require("../middlewares/ratelimiter.middleware")

// Register
router.post("/register",ratelimiter.OtpRateLimiter,authcontroller.registerUser);

// Verify OTP
router.post("/verifyotp",ratelimiter.OtpRateLimiter,authcontroller.verifyOtp);

// Login
router.post("/login",ratelimiter.LoginRateLimiter,authcontroller.loginUser);

// Forgot password - send OTP
router.post("/forgotpassword",ratelimiter.AuthRateLimiter,authcontroller.forgotPassword);

// Verify forgot password OTP
router.post("/verifyforgototp",ratelimiter.OtpRateLimiter,authcontroller.verifyForgotOtp);

// Reset password
router.post("/resetpassword",ratelimiter.AuthRateLimiter,authcontroller.resetPassword);

// Logout
router.post("/logout",authcontroller.logoutUser);

//profile
router.get("/profile",authcontroller.getMe);

module.exports = router;
