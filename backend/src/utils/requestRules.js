/**
 * Business rules for request acceptance and management
 */

// Days before event when freelancers can no longer accept
const ACCEPT_CUTOFF_DAYS = 2;

// Days after request creation when customer can no longer modify the accepted list
const LIST_LOCK_DAYS = 2;

// Minutes before event start when attendance window opens
const ATTENDANCE_OPEN_BEFORE_MIN = 15;

// Milliseconds in a day
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Get event start time from request
 */
function getEventStart(request) {
    if (!request || !request.start_time) return null;
    return new Date(request.start_time);
}

/**
 * Get event end time from request
 */
function getEventEnd(request) {
    if (!request || !request.end_time) return null;
    return new Date(request.end_time);
}

/**
 * Get acceptance deadline (ACCEPT_CUTOFF_DAYS before event start)
 */
function getAcceptDeadline(request) {
    const start = getEventStart(request);
    if (!start) return null;
    return new Date(start.getTime() - ACCEPT_CUTOFF_DAYS * MS_PER_DAY);
}

/**
 * Get list lock deadline (LIST_LOCK_DAYS after request creation)
 * After this, customer cannot modify the accepted list
 */
function getListLockDeadline(request) {
    if (!request || !request.createdAt) return null;
    return new Date(new Date(request.createdAt).getTime() + LIST_LOCK_DAYS * MS_PER_DAY);
}

/**
 * Check if freelancers can still accept this request
 * Cannot accept within ACCEPT_CUTOFF_DAYS of event start
 */
function canFreelancerAccept(request, now = new Date()) {
    const deadline = getAcceptDeadline(request);
    if (!deadline) return false;
    return now <= deadline;
}

/**
 * Check if customer can still modify the accepted list
 * Cannot modify after LIST_LOCK_DAYS from request creation
 */
function canCustomerModifyList(request, now = new Date()) {
    const lockDeadline = getListLockDeadline(request);
    if (!lockDeadline) return false;
    return now <= lockDeadline;
}

/**
 * Check if event has ended
 */
function hasEventEnded(request, now = new Date()) {
    const end = getEventEnd(request);
    if (!end) return false;
    return now > end;
}

/**
 * Get human-readable deadline for freelancer acceptance
 */
function getAcceptDeadlineMessage(request) {
    const deadline = getAcceptDeadline(request);
    if (!deadline) return "Unknown";
    
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return "Deadline passed";
    
    const hoursLeft = Math.floor(diff / (60 * 60 * 1000));
    const daysLeft = Math.floor(diff / MS_PER_DAY);
    
    if (daysLeft > 0) {
        return `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`;
    }
    
    return `${hoursLeft} hour${hoursLeft > 1 ? 's' : ''} left`;
}

/**
 * Get human-readable deadline for customer list modifications
 */
function getListLockMessage(request) {
    const lockDeadline = getListLockDeadline(request);
    if (!lockDeadline) return "Unknown";
    
    const now = new Date();
    const diff = lockDeadline.getTime() - now.getTime();
    
    if (diff <= 0) return "List is now locked";
    
    const hoursLeft = Math.floor(diff / (60 * 60 * 1000));
    const daysLeft = Math.floor(diff / MS_PER_DAY);
    
    if (daysLeft > 0) {
        return `List locks in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
    }
    
    return `List locks in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}`;
}

module.exports = {
    ACCEPT_CUTOFF_DAYS,
    LIST_LOCK_DAYS,
    ATTENDANCE_OPEN_BEFORE_MIN,
    MS_PER_DAY,
    getEventStart,
    getEventEnd,
    getAcceptDeadline,
    getListLockDeadline,
    canFreelancerAccept,
    canCustomerModifyList,
    hasEventEnded,
    getAcceptDeadlineMessage,
    getListLockMessage
};
