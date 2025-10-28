<?php
/**
 * Application Constants
 *
 * Centralized location for all magic numbers, strings, and configuration values
 * used throughout the WindPOS application.
 *
 * @package WindPOS
 * @company CodesWind
 */

// ============================================
// ORDER TYPES
// ============================================
define('ORDER_TYPE_DINE_IN', 'Dine In');
define('ORDER_TYPE_TAKEAWAY', 'Take Away');
define('ORDER_TYPE_DELIVERY', 'Delivery');
define('ORDER_TYPE_UBER_EATS', 'Uber Eats');
define('ORDER_TYPE_PICKME_FOOD', 'Pickme Food');

// Array of all valid order types
define('ALLOWED_ORDER_TYPES', [
    ORDER_TYPE_DINE_IN,
    ORDER_TYPE_TAKEAWAY,
    ORDER_TYPE_DELIVERY,
    ORDER_TYPE_UBER_EATS,
    ORDER_TYPE_PICKME_FOOD
]);

// ============================================
// ORDER STATUS
// ============================================
define('ORDER_STATUS_HOLD', 'Hold');
define('ORDER_STATUS_COMPLETED', 'Completed');
define('ORDER_STATUS_CANCELLED', 'Cancelled');

// Array of all valid order statuses
define('ALLOWED_ORDER_STATUSES', [
    ORDER_STATUS_HOLD,
    ORDER_STATUS_COMPLETED,
    ORDER_STATUS_CANCELLED
]);

// ============================================
// PAYMENT METHODS
// ============================================
define('PAYMENT_METHOD_CASH', 'Cash');
define('PAYMENT_METHOD_CARD', 'Card');
define('PAYMENT_METHOD_ONLINE', 'Online Transfer');

// Array of all valid payment methods
define('ALLOWED_PAYMENT_METHODS', [
    PAYMENT_METHOD_CASH,
    PAYMENT_METHOD_CARD,
    PAYMENT_METHOD_ONLINE
]);

// ============================================
// USER ROLES
// ============================================
define('USER_ROLE_SUPER_ADMIN', 'Super Admin');
define('USER_ROLE_ADMIN', 'Admin');
define('USER_ROLE_CASHIER', 'Cashier');

// Array of all valid user roles
define('ALLOWED_USER_ROLES', [
    USER_ROLE_SUPER_ADMIN,
    USER_ROLE_ADMIN,
    USER_ROLE_CASHIER
]);

// ============================================
// DISCOUNT TYPES
// ============================================
define('DISCOUNT_TYPE_PERCENTAGE', 'percentage');
define('DISCOUNT_TYPE_FIXED', 'fixed');

// Array of all valid discount types
define('ALLOWED_DISCOUNT_TYPES', [
    DISCOUNT_TYPE_PERCENTAGE,
    DISCOUNT_TYPE_FIXED
]);

// ============================================
// SPECIAL CUSTOMER IDS
// ============================================
// These are pre-configured customer accounts for delivery services
define('CUSTOMER_ID_UBER_EATS', 23);
define('CUSTOMER_ID_PICKME_FOOD', 24);

// Walk-in customer (no registration required)
define('CUSTOMER_ID_WALKIN', 1);

// ============================================
// PAGINATION
// ============================================
define('DEFAULT_PAGE_SIZE', 10);
define('MAX_PAGE_SIZE', 9999);
define('MIN_PAGE_SIZE', 1);

// ============================================
// VALIDATION RULES
// ============================================
// Phone number validation
define('PHONE_MIN_LENGTH', 10);
define('PHONE_MAX_LENGTH', 15);

// Password validation
define('PASSWORD_MIN_LENGTH', 6);
define('PASSWORD_MAX_LENGTH', 255);

// Username validation
define('USERNAME_MIN_LENGTH', 3);
define('USERNAME_MAX_LENGTH', 50);

// Price validation
define('MIN_PRICE', 0);
define('MAX_PRICE', 999999.99);

// Quantity validation
define('MIN_QUANTITY', 1);
define('MAX_QUANTITY', 9999);

// ============================================
// BUSINESS INFORMATION
// ============================================
define('COMPANY_NAME', 'CodesWind');
define('SYSTEM_NAME', 'WindPOS');
define('COMPANY_WEBSITE', 'codeswind.cloud');
define('COMPANY_PHONE', '0722440666');
define('SYSTEM_SUBTITLE', 'Restaurant Management System');

// ============================================
// DATE/TIME FORMATS
// ============================================
define('DATE_FORMAT_DISPLAY', 'Y-m-d');
define('DATETIME_FORMAT_DISPLAY', 'Y-m-d H:i:s');
define('TIME_FORMAT_DISPLAY', 'H:i:s');

// ============================================
// FILE UPLOAD LIMITS
// ============================================
define('MAX_UPLOAD_SIZE_MB', 5);
define('MAX_UPLOAD_SIZE_BYTES', MAX_UPLOAD_SIZE_MB * 1024 * 1024);

// Allowed image extensions for menu items
define('ALLOWED_IMAGE_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'webp']);

// Allowed MIME types for images
define('ALLOWED_IMAGE_MIME_TYPES', [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
]);

// ============================================
// ERROR MESSAGES
// ============================================
define('ERROR_MISSING_FIELDS', 'Missing required fields');
define('ERROR_INVALID_INPUT', 'Invalid input data');
define('ERROR_DATABASE_ERROR', 'Database error');
define('ERROR_UNAUTHORIZED', 'Unauthorized access');
define('ERROR_NOT_FOUND', 'Resource not found');
define('ERROR_DUPLICATE_ENTRY', 'Duplicate entry');

// ============================================
// SUCCESS MESSAGES
// ============================================
define('SUCCESS_CREATED', 'Created successfully');
define('SUCCESS_UPDATED', 'Updated successfully');
define('SUCCESS_DELETED', 'Deleted successfully');

// ============================================
// REPORT TYPES
// ============================================
define('REPORT_TYPE_SALES', 'sales');
define('REPORT_TYPE_INVENTORY', 'inventory');
define('REPORT_TYPE_CUSTOMER', 'customer');
define('REPORT_TYPE_EXPENSE', 'expense');

// ============================================
// EXPENSE CATEGORIES
// ============================================
define('EXPENSE_CATEGORY_RENT', 'Rent');
define('EXPENSE_CATEGORY_UTILITIES', 'Utilities');
define('EXPENSE_CATEGORY_SUPPLIES', 'Supplies');
define('EXPENSE_CATEGORY_SALARIES', 'Salaries');
define('EXPENSE_CATEGORY_MAINTENANCE', 'Maintenance');
define('EXPENSE_CATEGORY_OTHER', 'Other');

// ============================================
// HTTP STATUS CODES
// ============================================
define('HTTP_OK', 200);
define('HTTP_CREATED', 201);
define('HTTP_BAD_REQUEST', 400);
define('HTTP_UNAUTHORIZED', 401);
define('HTTP_FORBIDDEN', 403);
define('HTTP_NOT_FOUND', 404);
define('HTTP_INTERNAL_ERROR', 500);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a value is in an array of allowed values
 *
 * @param mixed $value The value to check
 * @param array $allowed Array of allowed values
 * @return bool True if value is allowed
 */
function isAllowedValue($value, $allowed) {
    return in_array($value, $allowed, true);
}

/**
 * Validate order type
 *
 * @param string $orderType The order type to validate
 * @return bool True if valid
 */
function isValidOrderType($orderType) {
    return isAllowedValue($orderType, ALLOWED_ORDER_TYPES);
}

/**
 * Validate order status
 *
 * @param string $status The status to validate
 * @return bool True if valid
 */
function isValidOrderStatus($status) {
    return isAllowedValue($status, ALLOWED_ORDER_STATUSES);
}

/**
 * Validate payment method
 *
 * @param string $method The payment method to validate
 * @return bool True if valid
 */
function isValidPaymentMethod($method) {
    return isAllowedValue($method, ALLOWED_PAYMENT_METHODS);
}

/**
 * Validate user role
 *
 * @param string $role The role to validate
 * @return bool True if valid
 */
function isValidUserRole($role) {
    return isAllowedValue($role, ALLOWED_USER_ROLES);
}

/**
 * Validate discount type
 *
 * @param string $type The discount type to validate
 * @return bool True if valid
 */
function isValidDiscountType($type) {
    return isAllowedValue($type, ALLOWED_DISCOUNT_TYPES);
}

/**
 * Get customer ID for delivery service order type
 *
 * @param string $orderType The order type
 * @return int|null Customer ID or null if not a delivery service
 */
function getDeliveryServiceCustomerId($orderType) {
    switch ($orderType) {
        case ORDER_TYPE_UBER_EATS:
            return CUSTOMER_ID_UBER_EATS;
        case ORDER_TYPE_PICKME_FOOD:
            return CUSTOMER_ID_PICKME_FOOD;
        default:
            return null;
    }
}

/**
 * Format price with 2 decimal places
 *
 * @param float $price The price to format
 * @return string Formatted price
 */
function formatPrice($price) {
    return number_format($price, 2, '.', '');
}

/**
 * Validate price range
 *
 * @param float $price The price to validate
 * @return bool True if valid
 */
function isValidPrice($price) {
    return $price >= MIN_PRICE && $price <= MAX_PRICE;
}

/**
 * Validate quantity range
 *
 * @param int $quantity The quantity to validate
 * @return bool True if valid
 */
function isValidQuantity($quantity) {
    return $quantity >= MIN_QUANTITY && $quantity <= MAX_QUANTITY;
}

?>
