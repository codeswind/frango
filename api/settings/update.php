<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $restaurantName = $conn->real_escape_string($input['restaurant_name']);
    $address = $conn->real_escape_string($input['address']);
    $mobile = $conn->real_escape_string($input['mobile']);
    $email = $conn->real_escape_string($input['email']);
    $taxRate = floatval($input['tax_rate']);
    $printKOT = isset($input['print_kot']) ? ($input['print_kot'] ? 1 : 0) : 1;
    $printInvoice = isset($input['print_invoice']) ? ($input['print_invoice'] ? 1 : 0) : 1;

    // Update settings (there should only be one record)
    $sql = "UPDATE settings SET
            restaurant_name = '$restaurantName',
            address = '$address',
            mobile = '$mobile',
            email = '$email',
            tax_rate = $taxRate,
            print_kot = $printKOT,
            print_invoice = $printInvoice,
            updated_at = CURRENT_TIMESTAMP
            WHERE id = 1";

    if ($conn->query($sql) === TRUE) {
        echo json_encode([
            'success' => true,
            'message' => 'Settings updated successfully'
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