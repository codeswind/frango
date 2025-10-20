<?php
// Test Full KOT Print with Footer
echo "<h2>Test: Full KOT Print with Footer</h2>";

$kot_printer = "XP-80C (copy 1)";

// Generate complete ESC/POS KOT with all sections
$escpos = chr(27) . chr(64); // Initialize printer

// Header
$escpos .= chr(27) . chr(97) . chr(1); // Center align
$escpos .= chr(27) . chr(33) . chr(24); // Double width + height
$escpos .= "KITCHEN ORDER\n";
$escpos .= chr(27) . chr(33) . chr(0); // Normal text
$escpos .= chr(27) . chr(97) . chr(1); // Center align
$escpos .= "Test Restaurant\n";
$escpos .= str_repeat("=", 48) . "\n";

// Order info
$escpos .= chr(27) . chr(97) . chr(0); // Left align
$escpos .= chr(27) . chr(33) . chr(8); // Bold text
$escpos .= "Order #: 999\n";
$escpos .= "Time: " . date('d/m/Y H:i:s') . "\n";
$escpos .= "Type: Test Order\n";
$escpos .= "Table: Table 1\n";
$escpos .= chr(27) . chr(33) . chr(0); // Normal text
$escpos .= str_repeat("=", 48) . "\n";

// Items
$escpos .= chr(27) . chr(33) . chr(8); // Bold
$escpos .= "MAIN COURSE\n";
$escpos .= chr(27) . chr(33) . chr(0); // Normal
$escpos .= str_repeat("-", 48) . "\n";

$escpos .= chr(27) . chr(33) . chr(16); // Double width
$escpos .= "x2  Burger\n";
$escpos .= chr(27) . chr(33) . chr(0); // Normal
$escpos .= "\n";

$escpos .= chr(27) . chr(33) . chr(16); // Double width
$escpos .= "x1  French Fries\n";
$escpos .= chr(27) . chr(33) . chr(0); // Normal
$escpos .= "\n";

$escpos .= str_repeat("-", 48) . "\n";

$escpos .= chr(27) . chr(33) . chr(8); // Bold
$escpos .= "BEVERAGES\n";
$escpos .= chr(27) . chr(33) . chr(0); // Normal
$escpos .= str_repeat("-", 48) . "\n";

$escpos .= chr(27) . chr(33) . chr(16); // Double width
$escpos .= "x3  Coca Cola\n";
$escpos .= chr(27) . chr(33) . chr(0); // Normal
$escpos .= "\n";

$escpos .= str_repeat("-", 48) . "\n";

// Footer - THIS SHOULD PRINT BEFORE CUTTING
$escpos .= chr(27) . chr(97) . chr(1); // Center align
$escpos .= chr(27) . chr(33) . chr(8); // Bold
$escpos .= "PREPARE IMMEDIATELY\n";
$escpos .= chr(27) . chr(33) . chr(0); // Normal
$escpos .= "\n\n\n\n\n\n"; // Extra blank lines

// Cut paper - partial cut
$escpos .= chr(29) . chr(86) . chr(66) . chr(0); // Partial cut

echo "<h3>Sending to KOT Printer: " . $kot_printer . "</h3>";

// Use direct file write method
$printer_path = "\\\\localhost\\" . $kot_printer;
$handle = @fopen($printer_path, 'wb');

if ($handle) {
    $bytes_written = fwrite($handle, $escpos);
    fflush($handle);
    usleep(500000); // Wait 500ms
    fclose($handle);
    sleep(1);

    echo "<strong style='color: green;'>SUCCESS!</strong><br>";
    echo "Bytes written: " . $bytes_written . "<br>";
    echo "Data length: " . strlen($escpos) . " bytes<br><br>";

    echo "<h3>Expected KOT Output:</h3>";
    echo "<pre>";
    echo "        KITCHEN ORDER\n";
    echo "      Test Restaurant\n";
    echo "================================================\n";
    echo "Order #: 999\n";
    echo "Time: " . date('d/m/Y H:i:s') . "\n";
    echo "Type: Test Order\n";
    echo "Table: Table 1\n";
    echo "================================================\n";
    echo "\n";
    echo "MAIN COURSE\n";
    echo "------------------------------------------------\n";
    echo "x2  Burger\n";
    echo "x1  French Fries\n";
    echo "------------------------------------------------\n";
    echo "\n";
    echo "BEVERAGES\n";
    echo "------------------------------------------------\n";
    echo "x3  Coca Cola\n";
    echo "------------------------------------------------\n";
    echo "\n";
    echo "     PREPARE IMMEDIATELY\n";
    echo "\n";
    echo "[Paper should cut here]\n";
    echo "</pre>";

    echo "<h3>Check Your KOT Printer!</h3>";
    echo "<p>You should see:</p>";
    echo "<ul>";
    echo "<li>✓ Complete header with 'KITCHEN ORDER'</li>";
    echo "<li>✓ Order details (Order #999, time, table)</li>";
    echo "<li>✓ All items (2 Burgers, 1 Fries, 3 Coke)</li>";
    echo "<li>✓ <strong>'PREPARE IMMEDIATELY' footer at the bottom</strong></li>";
    echo "<li>✓ Paper cut AFTER the footer (not before)</li>";
    echo "</ul>";

    echo "<p><strong>If footer is missing or cut off:</strong></p>";
    echo "<ul>";
    echo "<li>The printer might need more delay time</li>";
    echo "<li>Try disabling auto-cut completely</li>";
    echo "</ul>";

} else {
    echo "<strong style='color: red;'>FAILED to open printer</strong><br>";
    echo "Make sure printer is shared: " . $kot_printer;
}
?>
