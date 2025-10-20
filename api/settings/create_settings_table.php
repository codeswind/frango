<?php
include '../database.php';

// Create settings table
$sql = "CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_name VARCHAR(255) NOT NULL DEFAULT 'My Restaurant',
    address TEXT,
    mobile VARCHAR(20),
    email VARCHAR(100),
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    print_kot BOOLEAN DEFAULT TRUE,
    print_invoice BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";

if ($conn->query($sql) === TRUE) {
    echo "Settings table created successfully\n";

    // Check if settings record exists, if not create default
    $checkSql = "SELECT COUNT(*) as count FROM settings";
    $result = $conn->query($checkSql);
    $row = $result->fetch_assoc();

    if ($row['count'] == 0) {
        $insertSql = "INSERT INTO settings (restaurant_name, address, mobile, email, tax_rate) VALUES
                     ('Afkar Restaurant', '123 Main Street, City, State', '+1 234 567 8900', 'info@afkarrestaurant.com', 8.50)";

        if ($conn->query($insertSql) === TRUE) {
            echo "Default settings record created\n";
        } else {
            echo "Error creating default settings: " . $conn->error . "\n";
        }
    } else {
        echo "Settings record already exists\n";
    }
} else {
    echo "Error creating table: " . $conn->error . "\n";
}

$conn->close();
?>