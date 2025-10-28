<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!$input || !isset($input['restaurant_name']) || !isset($input['address']) ||
        !isset($input['mobile']) || !isset($input['email']) || !isset($input['tax_rate'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields'
        ]);
        exit;
    }

    $restaurantName = trim($input['restaurant_name']);
    $address = trim($input['address']);
    $mobile = trim($input['mobile']);
    $email = trim($input['email']);
    $taxRate = floatval($input['tax_rate']);
    $printKOT = isset($input['print_kot']) ? ($input['print_kot'] ? 1 : 0) : 1;
    $printInvoice = isset($input['print_invoice']) ? ($input['print_invoice'] ? 1 : 0) : 1;

    // Validate data
    if (empty($restaurantName)) {
        echo json_encode([
            'success' => false,
            'message' => 'Restaurant name is required'
        ]);
        exit;
    }

    if ($taxRate < 0 || $taxRate > 100) {
        echo json_encode([
            'success' => false,
            'message' => 'Tax rate must be between 0 and 100'
        ]);
        exit;
    }

    // Validate print settings (must be 0 or 1)
    if ($printKOT !== 0 && $printKOT !== 1) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid print_kot value'
        ]);
        exit;
    }

    if ($printInvoice !== 0 && $printInvoice !== 1) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid print_invoice value'
        ]);
        exit;
    }

    // Update settings using prepared statement
    $sql = "UPDATE settings SET
            restaurant_name = ?,
            address = ?,
            mobile = ?,
            email = ?,
            tax_rate = ?,
            print_kot = ?,
            print_invoice = ?,
            updated_at = CURRENT_TIMESTAMP
            WHERE id = 1";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssssdii", $restaurantName, $address, $mobile, $email, $taxRate, $printKOT, $printInvoice);

    if ($stmt->execute()) {
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

    $stmt->close();
}

$conn->close();
?>