<?php
// Test Print Script - Use this to diagnose printing issues

// Test 1: Check if printers are accessible
echo "<h2>Printer Test Script</h2>";

$invoice_printer = "XP-80C";
$kot_printer = "XP-80C (copy 1)";

echo "<h3>Step 1: Configured Printers</h3>";
echo "Invoice Printer: " . $invoice_printer . "<br>";
echo "KOT Printer: " . $kot_printer . "<br><br>";

// Test 2: Try to list available printers using WMI
echo "<h3>Step 2: Available Printers on System</h3>";
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    $output = [];
    exec('wmic printer get name', $output);
    echo "<pre>";
    print_r($output);
    echo "</pre>";
} else {
    echo "Not a Windows system<br>";
}

// Test 3: Create test files and try to print
echo "<h3>Step 3: Test Print to KOT Printer</h3>";

// Create simple test content
$test_content = "TEST PRINT\n";
$test_content .= "Date: " . date('Y-m-d H:i:s') . "\n";
$test_content .= "This is a test print from PHP\n";
$test_content .= "If you see this, printing works!\n\n\n";

$temp_file = sys_get_temp_dir() . '\\test_print_' . time() . '.txt';
file_put_contents($temp_file, $test_content);

echo "Test file created: " . $temp_file . "<br>";
echo "Test content:<br><pre>" . htmlspecialchars($test_content) . "</pre>";

// Try to print to KOT printer
$command = 'print /D:"' . $kot_printer . '" "' . $temp_file . '"';
echo "Command: " . htmlspecialchars($command) . "<br>";

exec($command . ' 2>&1', $output2, $return_var);

echo "Return code: " . $return_var . "<br>";
echo "Output:<br><pre>";
print_r($output2);
echo "</pre>";

if ($return_var === 0) {
    echo "<strong style='color: green;'>SUCCESS! Print command executed.</strong><br>";
} else {
    echo "<strong style='color: red;'>FAILED! Print command failed.</strong><br>";
}

echo "<br><br>";

// Test 4: Test print to Invoice printer
echo "<h3>Step 4: Test Print to Invoice Printer</h3>";

$temp_file2 = sys_get_temp_dir() . '\\test_invoice_' . time() . '.txt';
file_put_contents($temp_file2, $test_content);

$command2 = 'print /D:"' . $invoice_printer . '" "' . $temp_file2 . '"';
echo "Command: " . htmlspecialchars($command2) . "<br>";

exec($command2 . ' 2>&1', $output3, $return_var2);

echo "Return code: " . $return_var2 . "<br>";
echo "Output:<br><pre>";
print_r($output3);
echo "</pre>";

if ($return_var2 === 0) {
    echo "<strong style='color: green;'>SUCCESS! Print command executed.</strong><br>";
} else {
    echo "<strong style='color: red;'>FAILED! Print command failed.</strong><br>";
}

echo "<br><br>";

// Test 5: Alternative method using COM object (if available)
echo "<h3>Step 5: Alternative Method - COM Object</h3>";

if (class_exists('COM')) {
    echo "COM extension is available!<br>";
    try {
        $shell = new COM("WScript.Shell");
        $exec = $shell->Run('notepad.exe /p ' . $temp_file, 0, false);
        echo "Notepad print command sent<br>";
    } catch (Exception $e) {
        echo "COM Error: " . $e->getMessage() . "<br>";
    }
} else {
    echo "COM extension is NOT available. You might need to enable it in php.ini<br>";
    echo "To enable: Uncomment 'extension=com_dotnet' in php.ini and restart Apache<br>";
}

echo "<br><br>";

// Test 6: Check PHP configuration
echo "<h3>Step 6: PHP Configuration</h3>";
echo "PHP Version: " . phpversion() . "<br>";
echo "OS: " . PHP_OS . "<br>";
echo "Temp Directory: " . sys_get_temp_dir() . "<br>";
echo "exec() function: " . (function_exists('exec') ? 'Available' : 'Disabled') . "<br>";

echo "<br><br>";

// Cleanup note
echo "<h3>Note:</h3>";
echo "Check your printers if any test printout appeared.<br>";
echo "Temp files created:<br>";
echo "- " . $temp_file . "<br>";
echo "- " . $temp_file2 . "<br>";
echo "These will be automatically cleaned up on next reboot.<br>";

?>
