<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['id']) || !isset($input['is_deleted'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid input data'
        ]);
        exit;
    }

    $id = intval($input['id']);
    $is_deleted = intval($input['is_deleted']);

    // Validate data
    if ($id <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid table ID'
        ]);
        exit;
    }

    if ($is_deleted !== 0 && $is_deleted !== 1) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid deletion value. Must be 0 or 1'
        ]);
        exit;
    }

    $sql = "UPDATE tables SET is_deleted = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $is_deleted, $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            $action_text = $is_deleted ? 'deleted' : 'restored';
            echo json_encode([
                'success' => true,
                'message' => "Table $action_text successfully"
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'No rows affected. Table ID may not exist.'
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