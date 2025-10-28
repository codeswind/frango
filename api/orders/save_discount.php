<?php
include '../cors.php';
include '../database.php';
include '../auth.php';

// Require authentication
requireAuthWithTimeout();

// Cashiers can apply discounts
requireRole(PERM_CREATE_ORDERS);

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($input['order_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing order_id']);
        $conn->close();
        exit;
    }

    $order_id = intval($input['order_id']);
    $discount_type = isset($input['discount_type']) ? trim($input['discount_type']) : null;
    $discount_value = isset($input['discount_value']) ? floatval($input['discount_value']) : 0;
    $discount_amount = isset($input['discount_amount']) ? floatval($input['discount_amount']) : 0;
    $final_amount = isset($input['final_amount']) ? floatval($input['final_amount']) : 0;

    // Use prepared statement for security
    $sql = "UPDATE orders SET
            discount_type = ?,
            discount_value = ?,
            discount_amount = ?,
            final_amount = ?
            WHERE id = ?";

    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        $conn->close();
        exit;
    }

    $stmt->bind_param('sdddi', $discount_type, $discount_value, $discount_amount, $final_amount, $order_id);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Discount saved successfully'
        ]);
        $stmt->close();
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
