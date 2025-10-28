<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    // Validate required parameter
    if (!isset($_GET['customer_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required parameter: customer_id'
        ]);
        exit;
    }

    $customerId = intval($_GET['customer_id']);

    // Validate ID
    if ($customerId <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid customer ID'
        ]);
        exit;
    }

    // Get order count for customer using prepared statement
    // Count all orders except cancelled ones (Hold and Completed orders)
    $sql = "SELECT COUNT(*) as order_count FROM orders WHERE customer_id = ? AND status IN ('Hold', 'Completed')";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $customerId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();

        echo json_encode([
            'success' => true,
            'order_count' => intval($row['order_count'])
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'order_count' => 0
        ]);
    }

    $stmt->close();
}

$conn->close();
?>
