<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $id = $input['id'];
    $name = $input['name'];
    $mobile = $input['mobile'];
    $address = isset($input['address']) ? $input['address'] : '';

    // Check if mobile number already exists for other customers (excluding current customer)
    $checkSql = "SELECT id FROM customers WHERE mobile = '$mobile' AND id != $id";
    $checkResult = $conn->query($checkSql);

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Mobile number already exists. Please use a different mobile number.'
        ]);
        $conn->close();
        exit;
    }

    $sql = "UPDATE customers SET name = '$name', mobile = '$mobile', address = '$address' WHERE id = $id";

    if ($conn->query($sql) === TRUE) {
        echo json_encode([
            'success' => true,
            'message' => 'Customer updated successfully'
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