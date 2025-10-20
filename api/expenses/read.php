<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $sql = "SELECT * FROM expenses ORDER BY date DESC";
    $result = $conn->query($sql);

    $expenses = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $expenses[] = $row;
        }
    }

    echo json_encode([
        'success' => true,
        'data' => $expenses
    ]);
}

$conn->close();
?>