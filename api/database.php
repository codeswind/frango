<?php
// Database connection configuration
$host = 'localhost';
$username = 'root';
$password = 'Abdullah2004*';
$database = 'pos_restaurant';

// Create connection
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to utf8
$conn->set_charset("utf8");
?>