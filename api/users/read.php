<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $sql = "SELECT id, username, role, created_at FROM users WHERE is_deleted = 0 ORDER BY created_at DESC";
    $result = $conn->query($sql);

    $users = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
    }

    echo json_encode([
        'success' => true,
        'data' => $users
    ]);
}

$conn->close();
?>