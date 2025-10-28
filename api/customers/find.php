<?php
include '../cors.php';
include '../database.php';
include '../auth.php';

// Require authentication
requireAuthWithTimeout();

// All authenticated users can view customers
requireRole(PERM_VIEW_CUSTOMERS);

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    // Validate required parameter
    if (!isset($_GET['mobile']) || empty($_GET['mobile'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Mobile number is required'
        ]);
        exit;
    }

    $mobile = $conn->real_escape_string(trim($_GET['mobile']));

    // Use prepared statement for security
    $sql = "SELECT * FROM customers WHERE mobile = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $mobile);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $customer = $result->fetch_assoc();
        echo json_encode([
            'success' => true,
            'found' => true,
            'customer' => $customer
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'found' => false
        ]);
    }

    $stmt->close();
}

$conn->close();
?>