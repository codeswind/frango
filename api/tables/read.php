<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $sql = "SELECT * FROM tables WHERE is_deleted = 0 ORDER BY id ASC";
    $result = $conn->query($sql);

    $tables = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $tables[] = $row;
        }
    }

    echo json_encode([
        'success' => true,
        'data' => $tables
    ]);
}

$conn->close();
?>