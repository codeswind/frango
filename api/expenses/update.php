<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $id = $input['id'];
    $description = $input['description'];
    $amount = $input['amount'];
    $date = $input['date'];

    if (empty($id) || empty($description) || empty($amount) || empty($date)) {
        echo json_encode([
            'success' => false,
            'message' => 'All fields are required'
        ]);
        exit;
    }

    $sql = "UPDATE expenses SET description = ?, amount = ?, date = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssi", $description, $amount, $date, $id);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Expense updated successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error updating expense'
        ]);
    }

    $stmt->close();
}

$conn->close();
?>