<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['id']) || !isset($input['table_name'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid input data'
        ]);
        exit;
    }

    $id = (int)$input['id'];
    $table_name = trim($input['table_name']);
    $status = isset($input['status']) ? $input['status'] : 'Available';

    if (empty($table_name)) {
        echo json_encode([
            'success' => false,
            'message' => 'Table name is required'
        ]);
        exit;
    }

    // Check if table name already exists (excluding current table)
    $check_sql = "SELECT id FROM tables WHERE table_name = ? AND id != ? AND is_deleted = 0";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("si", $table_name, $id);
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

    // Only update if table is not deleted
    $sql = "UPDATE tables SET table_name = ?, status = ? WHERE id = ? AND is_deleted = 0";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssi", $table_name, $status, $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Table updated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'No rows affected. Table ID may not exist or table is deleted.'
            ]);
        }
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