<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $sql = "SELECT * FROM categories ORDER BY name ASC";
    $result = $conn->query($sql);

    $categories = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $categories[] = $row;
        }
    }

    echo json_encode([
        'success' => true,
        'data' => $categories
    ]);
}

$conn->close();
?>