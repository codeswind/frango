<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $sql = "SELECT * FROM settings LIMIT 1";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $settings = $result->fetch_assoc();
        echo json_encode([
            'success' => true,
            'data' => $settings
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No settings found'
        ]);
    }
}

$conn->close();
?>