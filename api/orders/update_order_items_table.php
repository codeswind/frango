<?php
include __DIR__ . '/../database.php';

// Add kot_printed column to order_items table
$sql1 = "ALTER TABLE order_items ADD COLUMN kot_printed BOOLEAN DEFAULT FALSE";
$sql2 = "ALTER TABLE order_items ADD COLUMN added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP";

// Execute first SQL
$success1 = $conn->query($sql1);
if ($success1 === TRUE) {
    echo "kot_printed column added successfully\n";
} else {
    if (strpos($conn->error, "Duplicate column name") !== false) {
        echo "kot_printed column already exists\n";
    } else {
        echo "Error adding kot_printed column: " . $conn->error . "\n";
    }
}

// Execute second SQL
$success2 = $conn->query($sql2);
if ($success2 === TRUE) {
    echo "added_at column added successfully\n";
} else {
    if (strpos($conn->error, "Duplicate column name") !== false) {
        echo "added_at column already exists\n";
    } else {
        echo "Error adding added_at column: " . $conn->error . "\n";
    }
}

// Mark all existing items as already printed (for existing orders)
$update_sql = "UPDATE order_items SET kot_printed = TRUE WHERE kot_printed IS NULL OR kot_printed = 0";

if ($conn->query($update_sql) === TRUE) {
    echo "Existing order items marked as printed\n";
} else {
    echo "Error updating existing items: " . $conn->error . "\n";
}

$conn->close();
?>