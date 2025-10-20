<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['id']) || !isset($input['is_active'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid input data'
        ]);
        exit;
    }

    $id = (int)$input['id'];
    $is_active = (int)$input['is_active'];

    // First check if the table exists and get current values
    $check_sql = "SELECT id, table_name, is_active, is_deleted FROM tables WHERE id = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("i", $id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows == 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Table ID does not exist'
        ]);
        $check_stmt->close();
        exit;
    }

    $table_data = $check_result->fetch_assoc();
    $check_stmt->close();

    if ($table_data['is_deleted'] == 1) {
        echo json_encode([
            'success' => false,
            'message' => 'Cannot update deleted table'
        ]);
        exit;
    }

    // Update the status
    $sql = "UPDATE tables SET is_active = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $is_active, $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            $status_text = $is_active ? 'activated' : 'deactivated';
            echo json_encode([
                'success' => true,
                'message' => "Table $status_text successfully"
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'No rows affected - status may already be the same'
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