<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $name = $input['name'];
    $mobile = $input['mobile'];
    $address = isset($input['address']) ? $input['address'] : '';

    // Check if mobile number already exists
    $checkSql = "SELECT id FROM customers WHERE mobile = '$mobile'";
    $checkResult = $conn->query($checkSql);

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Mobile number already exists. Please use a different mobile number.'
        ]);
        $conn->close();
        exit;
    }

    $sql = "INSERT INTO customers (name, mobile, address) VALUES ('$name', '$mobile', '$address')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode([
            'success' => true,
            'message' => 'Customer created successfully',
            'id' => $conn->insert_id
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