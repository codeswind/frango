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

    $id = (int)$input['id'];
    $is_deleted = (int)$input['is_deleted'];

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