<?php
// Test Invoice Print to Thermal Printer
echo "<h2>Test: Invoice Print to XP-80C Thermal Printer</h2>";

$invoice_printer = "XP-80C";

// Generate sample invoice with ESC/POS
$escpos = chr(27) . chr(64); // Initialize

// Header
$escpos .= chr(27) . chr(97) . chr(1); // Center
$escpos .= chr(27) . chr(33) . chr(24); // Double size
$escpos .= "TEST RESTAURANT\n";
$escpos .= chr(27) . chr(33) . chr(0); // Normal
$escpos .= "123 Main Street, City\n";
$escpos .= "Tel: 0123456789\n";
$escpos .= "Email: test@restaurant.com\n";
$escpos .= str_repeat("=", 48) . "\n";

// Invoice title
$escpos .= chr(27) . chr(97) . chr(1); // Center
$escpos .= chr(27) . chr(33) . chr(8); // Bold
$escpos .= "INVOICE\n";
$escpos .= chr(27) . chr(33) . chr(0); // Normal
$escpos .= str_repeat("=", 48) . "\n";

// Order info
$escpos .= chr(27) . chr(97) . chr(0); // Left
$escpos .= "Invoice #: INV-00999\n";
$escpos .= "Date: " . date('d/m/Y H:i') . "\n";
$escpos .= "Type: Test Order\n";
$escpos .= "Customer: Test Customer\n";
$escpos .= "Table: Table 5\n";
$escpos .= "Payment: Cash\n";
$escpos .= str_repeat("-", 48) . "\n";

// Items header
$escpos .= chr(27) . chr(33) . chr(8); // Bold
$escpos .= sprintf("%-24s %4s %8s %10s\n", "Item", "Qty", "Price", "Total");
$escpos .= chr(27) . chr(33) . chr(0); // Normal
$escpos .= str_repeat("-", 48) . "\n";

// Sample items
$items = [
    ['name' => 'Burger', 'qty' => 2, 'price' => 450.00],
    ['name' => 'French Fries', 'qty' => 1, 'price' => 200.00],
    ['name' => 'Coca Cola', 'qty' => 3, 'price' => 150.00]
];

$subtotal = 0;
foreach ($items as $item) {
    $total = $item['qty'] * $item['price'];
    $subtotal += $total;

    $escpos .= sprintf("%-24s\n", substr($item['name'], 0, 24));
    $escpos .= sprintf("%28s %4d %8.2f %10.2f\n", "", $item['qty'], $item['price'], $total);
}

$escpos .= str_repeat("-", 48) . "\n";

// Totals
$tax_rate = 10;
$tax = $subtotal * ($tax_rate / 100);
$total = $subtotal + $tax;

$escpos .= sprintf("%38s %10.2f\n", "Subtotal:", $subtotal);
$escpos .= sprintf("%38s %10.2f\n", "Tax (10%):", $tax);
$escpos .= str_repeat("=", 48) . "\n";

// Grand total
$escpos .= chr(27) . chr(33) . chr(24); // Double
$escpos .= chr(27) . chr(97) . chr(2); // Right align
$escpos .= "TOTAL: Rs." . number_format($total, 2) . "\n";
$escpos .= chr(27) . chr(33) . chr(0); // Normal
$escpos .= chr(27) . chr(97) . chr(0); // Left align
$escpos .= str_repeat("=", 48) . "\n";

// Footer
$escpos .= chr(27) . chr(97) . chr(1); // Center
$escpos .= "\n";
$escpos .= "Thank you for your business!\n";
$escpos .= "Please visit again\n";
$escpos .= "\n\n\n\n\n\n";

// Cut
$escpos .= chr(29) . chr(86) . chr(66) . chr(0);

echo "<h3>Sending to Invoice Printer: " . $invoice_printer . "</h3>";

// Use direct file write
$printer_path = "\\\\localhost\\" . $invoice_printer;
$handle = @fopen($printer_path, 'wb');

if ($handle) {
    $bytes = fwrite($handle, $escpos);
    fflush($handle);
    usleep(500000);
    fclose($handle);
    sleep(1);

    echo "<strong style='color: green;'>SUCCESS!</strong><br>";
    echo "Bytes written: " . $bytes . "<br>";
    echo "Data length: " . strlen($escpos) . " bytes<br><br>";

    echo "<h3>Expected Invoice Output:</h3>";
    echo "<pre>";
    echo "        TEST RESTAURANT\n";
    echo "      123 Main Street, City\n";
    echo "      Tel: 0123456789\n";
    echo "   Email: test@restaurant.com\n";
    echo "================================================\n";
    echo "\n";
    echo "            INVOICE\n";
    echo "================================================\n";
    echo "\n";
    echo "Invoice #: INV-00999\n";
    echo "Date: " . date('d/m/Y H:i') . "\n";
    echo "Type: Test Order\n";
    echo "Customer: Test Customer\n";
    echo "Table: Table 5\n";
    echo "Payment: Cash\n";
    echo "------------------------------------------------\n";
    echo "Item                      Qty    Price      Total\n";
    echo "------------------------------------------------\n";
    echo "Burger\n";
    echo "                              2   450.00     900.00\n";
    echo "French Fries\n";
    echo "                              1   200.00     200.00\n";
    echo "Coca Cola\n";
    echo "                              3   150.00     450.00\n";
    echo "------------------------------------------------\n";
    echo "                              Subtotal:    1550.00\n";
    echo "                              Tax (10%):    155.00\n";
    echo "================================================\n";
    echo "                   TOTAL: Rs.1,705.00\n";
    echo "================================================\n";
    echo "\n";
    echo "      Thank you for your business!\n";
    echo "           Please visit again\n";
    echo "</pre>";

    echo "<h3>✅ Check Invoice Printer (XP-80C)!</h3>";
    echo "<p>You should see a complete invoice receipt.</p>";

} else {
    echo "<strong style='color: red;'>FAILED</strong><br>";
    echo "Could not open printer: " . $invoice_printer . "<br>";
    echo "Make sure printer is shared!";
}
?>
