<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $mobile = $_GET['mobile'];

    $sql = "SELECT * FROM customers WHERE mobile = '$mobile'";
    $result = $conn->query($sql);

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
}

$conn->close();
?>