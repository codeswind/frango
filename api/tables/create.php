<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['table_name'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid input data'
        ]);
        exit;
    }

    $table_name = trim($input['table_name']);
    $status = isset($input['status']) ? $input['status'] : 'Available';

    if (empty($table_name)) {
        echo json_encode([
            'success' => false,
            'message' => 'Table name is required'
        ]);
        exit;
    }

    // Check if table name already exists
    $check_sql = "SELECT id FROM tables WHERE table_name = ? AND is_deleted = 0";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("s", $table_name);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Table name already exists'
        ]);
        $check_stmt->close();
        exit;
    }
    $check_stmt->close();

    $sql = "INSERT INTO tables (table_name, status) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $table_name, $status);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Table created successfully',
            'id' => $conn->insert_id
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $conn->error
        ]);
    }

    $stmt->close();
}

$conn->close();
?>