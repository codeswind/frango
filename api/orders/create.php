<?php
include '../cors.php';
include '../database.php';
include '../constants.php';
include '../auth.php';

// Require authentication
requireAuthWithTimeout();

// Check permission to create orders
requireRole(PERM_CREATE_ORDERS);

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['order_type'])) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode([
            'success' => false,
            'message' => ERROR_MISSING_FIELDS
        ]);
        exit;
    }

    $order_type = trim($input['order_type']);

    // Validate order_type against allowed values from constants
    if (!isValidOrderType($order_type)) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid order type: ' . $order_type . '. Allowed: ' . implode(', ', ALLOWED_ORDER_TYPES)
        ]);
        exit;
    }

    // Auto-assign customer_id for delivery service orders using constants
    $delivery_customer_id = getDeliveryServiceCustomerId($order_type);
    if ($delivery_customer_id !== null) {
        $customer_id = $delivery_customer_id;
    } else {
        $customer_id = isset($input['customer_id']) && $input['customer_id'] !== null && $input['customer_id'] !== '' ? intval($input['customer_id']) : null;
    }

    $table_id = isset($input['table_id']) && $input['table_id'] !== null && $input['table_id'] !== '' ? intval($input['table_id']) : null;
    $external_order_id = isset($input['external_order_id']) && $input['external_order_id'] !== null && $input['external_order_id'] !== '' ? trim($input['external_order_id']) : null;

    // Use prepared statement for security
    $sql = "INSERT INTO orders (order_type, customer_id, table_id, external_order_id, status)
            VALUES (?, ?, ?, ?, 'Hold')";

    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        $conn->close();
        exit;
    }

    $stmt->bind_param('siis', $order_type, $customer_id, $table_id, $external_order_id);

    if ($stmt->execute()) {
        $order_id = $stmt->insert_id;
        $stmt->close();
        echo json_encode([
            'success' => true,
            'message' => 'Order created successfully',
            'order_id' => $order_id
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $stmt->error
        ]);
        $stmt->close();
    }
}

$conn->close();
?>