<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $start_date = isset($_GET['start_date']) && !empty($_GET['start_date']) ? $_GET['start_date'] : '';
    $end_date = isset($_GET['end_date']) && !empty($_GET['end_date']) ? $_GET['end_date'] : '';

    $sql = "SELECT * FROM expenses";

    if ($start_date != '' && $end_date != '') {
        $sql .= " WHERE DATE(date) BETWEEN ? AND ?";
    }

    $sql .= " ORDER BY date DESC";

    if ($start_date != '' && $end_date != '') {
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $start_date, $end_date);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $conn->query($sql);
    }

    $expenses = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $expenses[] = $row;
        }
    }

    if (isset($stmt)) {
        $stmt->close();
    }

    echo json_encode([
        'success' => true,
        'data' => $expenses
    ]);
}

$conn->close();
?>