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

    $id = intval($input['id']);
    $is_active = intval($input['is_active']);

    // Validate data
    if ($id <= 0 || ($is_active !== 0 && $is_active !== 1)) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid input data'
        ]);
        exit;
    }

    // Only update if item is not deleted
    $sql = "UPDATE menu_items SET is_active = ? WHERE id = ? AND is_deleted = 0";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $is_active, $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            $status_text = $is_active ? 'activated' : 'deactivated';
            echo json_encode([
                'success' => true,
                'message' => "Menu item $status_text successfully"
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'No rows affected. Item ID may not exist or item is deleted.'
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