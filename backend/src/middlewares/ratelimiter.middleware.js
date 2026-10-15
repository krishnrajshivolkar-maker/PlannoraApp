const rateLimit = require("express-rate-limit");

// Limits are intentionally kept per-purpose so that hammering one flow
// (e.g. password reset) cannot lock a legitimate user out of login.
const AuthRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 5, // Maximum 5 requests per IP
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

const LoginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

const OtpRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.OTP_RATE_LIMIT_MAX) || 20,
    message: {
        success: false,
        message: "Too many OTP requests. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Creating a request enqueues background work (queue + fan-out to every
// matching freelancer), so it must not be spammable.
const RequestRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.REQUEST_RATE_LIMIT_MAX) || 10,
    // Only successful creations count, so a user fixing bad input is not punished.
    skipFailedRequests: true,
    message: {
        success: false,
        message: "Too many requests created. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// accept / reject are frequent but bounded; keep them generous per IP.
const ActionRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.ACTION_RATE_LIMIT_MAX) || 60,
    message: {
        success: false,
        message: "Too many request actions. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

/*
    The completion code is only 6 digits and completing pays out, so it must
    not be guessable: without a limit a freelancer who accepted a request can
    simply try every code until one works.
*/
const CompleteRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.COMPLETE_RATE_LIMIT_MAX) || 20,
    message: {
        success: false,
        message: "Too many completion attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    AuthRateLimiter,
    LoginRateLimiter,
    OtpRateLimiter,
    RequestRateLimiter,
    ActionRateLimiter,
    CompleteRateLimiter
};
