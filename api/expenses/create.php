<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $description = $input['description'];
    $amount = $input['amount'];
    $date = $input['date'];

    $sql = "INSERT INTO expenses (description, amount, date) VALUES ('$description', '$amount', '$date')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode([
            'success' => true,
            'message' => 'Expense created successfully',
            'id' => $conn->insert_id
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $conn->error
        ]);
    }
}

$conn->close();
?>