<?php
// Test COPY method for thermal printer
echo "<h2>Test: COPY Command Method for Thermal Printers</h2>";

$kot_printer = "XP-80C (copy 1)";
$invoice_printer = "XP-80C";

// Create test ESC/POS content
$escpos = chr(27) . chr(64); // Initialize
$escpos .= chr(27) . chr(97) . chr(1); // Center align
$escpos .= chr(27) . chr(33) . chr(24); // Double size
$escpos .= "TEST PRINT\n";
$escpos .= chr(27) . chr(33) . chr(0); // Normal
$escpos .= "Date: " . date('Y-m-d H:i:s') . "\n";
$escpos .= "This is a test from PHP\n";
$escpos .= "If you see this, it works!\n\n\n";
$escpos .= chr(29) . chr(86) . chr(1); // Cut paper

echo "<h3>Test 1: COPY /B Command to KOT Printer</h3>";

$temp_file = sys_get_temp_dir() . '\\test_kot_' . time() . '.prn';
file_put_contents($temp_file, $escpos);

$command = 'copy /B "' . $temp_file . '" "\\\\localhost\\' . $kot_printer . '"';
echo "Command: " . htmlspecialchars($command) . "<br>";

exec($command . ' 2>&1', $output, $return_var);

echo "Return code: " . $return_var . "<br>";
echo "Output:<br><pre>";
print_r($output);
echo "</pre>";

if ($return_var === 0 && (!isset($output[0]) || stripos($output[0], 'copied') !== false)) {
    echo "<strong style='color: green;'>SUCCESS! Check KOT printer.</strong><br>";
} else {
    echo "<strong style='color: red;'>FAILED</strong><br>";
}

sleep(1);
if (file_exists($temp_file)) {
    @unlink($temp_file);
}

echo "<hr>";

echo "<h3>Test 2: Direct File Write to KOT Printer</h3>";

$printer_path = "\\\\localhost\\" . $kot_printer;
echo "Printer path: " . $printer_path . "<br>";

$handle = @fopen($printer_path, 'wb');

if ($handle) {
    echo "File handle opened successfully!<br>";
    $bytes = fwrite($handle, $escpos);
    echo "Bytes written: " . $bytes . "<br>";
    fclose($handle);
    echo "<strong style='color: green;'>SUCCESS! Check KOT printer.</strong><br>";
} else {
    echo "<strong style='color: red;'>FAILED to open printer handle</strong><br>";
    echo "Make sure printer is shared!<br>";
}

echo "<hr>";

echo "<h3>Test 3: TYPE Command to KOT Printer</h3>";

$temp_file2 = sys_get_temp_dir() . '\\test_kot2_' . time() . '.prn';
file_put_contents($temp_file2, $escpos);

$command2 = 'type "' . $temp_file2 . '" > "\\\\localhost\\' . $kot_printer . '"';
echo "Command: " . htmlspecialchars($command2) . "<br>";

exec($command2 . ' 2>&1', $output2, $return_var2);

echo "Return code: " . $return_var2 . "<br>";
echo "Output:<br><pre>";
print_r($output2);
echo "</pre>";

if ($return_var2 === 0) {
    echo "<strong style='color: green;'>SUCCESS! Check KOT printer.</strong><br>";
} else {
    echo "<strong style='color: red;'>FAILED</strong><br>";
}

sleep(1);
if (file_exists($temp_file2)) {
    @unlink($temp_file2);
}

echo "<hr>";

echo "<h3>Instructions:</h3>";
echo "<ol>";
echo "<li>Check both printers to see if any test page printed</li>";
echo "<li>If Method 2 (Direct File Write) works, that's the best option</li>";
echo "<li>If none work, the printers need to be shared first</li>";
echo "</ol>";

echo "<h3>How to Share Printers:</h3>";
echo "<ol>";
echo "<li>Control Panel → Devices and Printers</li>";
echo "<li>Right-click printer → Printer Properties</li>";
echo "<li>Sharing tab → Check 'Share this printer'</li>";
echo "<li>Click Apply and OK</li>";
echo "</ol>";
?>
