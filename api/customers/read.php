<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $sql = "SELECT id, name, mobile, address, created_at FROM customers ORDER BY created_at DESC";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $customers = [];
        while($row = $result->fetch_assoc()) {
            $customers[] = $row;
        }
        echo json_encode([
            'success' => true,
            'data' => $customers
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'data' => []
        ]);
    }
}

$conn->close();
?>