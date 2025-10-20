<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['order_type'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing order_type'
        ]);
        exit;
    }

    $order_type = trim($input['order_type']);

    // Validate order_type against allowed values
    $allowed_types = ['Dine In', 'Take Away', 'Delivery', 'Uber Eats', 'Pickme Food'];
    if (!in_array($order_type, $allowed_types)) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid order type: ' . $order_type . '. Allowed: ' . implode(', ', $allowed_types)
        ]);
        exit;
    }

    // Auto-assign customer_id based on order type
    if ($order_type === 'Uber Eats') {
        $customer_id = 23; // Uber Eats customer ID from database
    } elseif ($order_type === 'Pickme Food') {
        $customer_id = 24; // Pickme Food customer ID from database
    } else {
        $customer_id = isset($input['customer_id']) && $input['customer_id'] !== null && $input['customer_id'] !== '' ? $input['customer_id'] : 'NULL';
    }

    $table_id = isset($input['table_id']) && $input['table_id'] !== null && $input['table_id'] !== '' ? $input['table_id'] : 'NULL';
    $external_order_id = isset($input['external_order_id']) && $input['external_order_id'] !== null && $input['external_order_id'] !== '' ? "'" . $input['external_order_id'] . "'" : 'NULL';

    if ($customer_id !== 'NULL') {
        $customer_id = $customer_id;
    }
    if ($table_id !== 'NULL') {
        $table_id = $table_id;
    }

    $sql = "INSERT INTO orders (order_type, customer_id, table_id, external_order_id, status)
            VALUES ('$order_type', $customer_id, $table_id, $external_order_id, 'Hold')";

    if ($conn->query($sql) === TRUE) {
        $order_id = $conn->insert_id;
        echo json_encode([
            'success' => true,
            'message' => 'Order created successfully',
            'order_id' => $order_id
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $conn->error
        ]);
    }
}

$conn->close();
?>