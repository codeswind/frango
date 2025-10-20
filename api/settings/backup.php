<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $type = $input['type'] ?? 'csv'; // 'csv' or 'sql'
    $tables = $input['tables'] ?? ['all']; // specific tables or 'all'

    if ($type === 'csv') {
        generateCSVBackup($conn, $tables);
    } elseif ($type === 'sql') {
        generateSQLBackup($conn, $tables);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid backup type'
        ]);
    }
}

function generateCSVBackup($conn, $tables) {
    try {
        $backupData = [];

        if (in_array('all', $tables)) {
            // Get all table names
            $result = $conn->query("SHOW TABLES");
            $tables = [];
            while ($row = $result->fetch_array()) {
                $tables[] = $row[0];
            }
        }

        foreach ($tables as $table) {
            // Sanitize table name to prevent SQL injection
            $table = preg_replace('/[^a-zA-Z0-9_]/', '', $table);
            $result = $conn->query("SELECT * FROM `$table`");
            if ($result && $result->num_rows > 0) {
                $tableData = [];
                $columns = [];

                // Get column names
                while ($fieldInfo = $result->fetch_field()) {
                    $columns[] = $fieldInfo->name;
                }
                $tableData[] = $columns;

                // Reset result pointer
                $result->data_seek(0);

                // Get data rows
                while ($row = $result->fetch_assoc()) {
                    $tableData[] = array_values($row);
                }

                $backupData[$table] = $tableData;
            }
        }

        echo json_encode([
            'success' => true,
            'type' => 'csv',
            'data' => $backupData,
            'filename' => 'pos_backup_' . date('Y-m-d_H-i-s') . '.json'
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error generating CSV backup: ' . $e->getMessage()
        ]);
    }
}

function generateSQLBackup($conn, $tables) {
    try {
        $sqlBackup = "-- POS Restaurant Database Backup\n";
        $sqlBackup .= "-- Generated on: " . date('Y-m-d H:i:s') . "\n\n";
        $sqlBackup .= "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n";
        $sqlBackup .= "START TRANSACTION;\n";
        $sqlBackup .= "SET time_zone = \"+00:00\";\n\n";

        if (in_array('all', $tables)) {
            // Get all table names
            $result = $conn->query("SHOW TABLES");
            $tables = [];
            while ($row = $result->fetch_array()) {
                $tables[] = $row[0];
            }
        }

        foreach ($tables as $table) {
            // Sanitize table name to prevent SQL injection
            $table = preg_replace('/[^a-zA-Z0-9_]/', '', $table);
            $sqlBackup .= "-- --------------------------------------------------------\n";
            $sqlBackup .= "-- Table structure for table `$table`\n";
            $sqlBackup .= "-- --------------------------------------------------------\n\n";

            // Get CREATE TABLE statement
            $result = $conn->query("SHOW CREATE TABLE `$table`");
            if ($result) {
                $row = $result->fetch_assoc();
                $sqlBackup .= $row['Create Table'] . ";\n\n";
            }

            // Get table data
            $result = $conn->query("SELECT * FROM `$table`");
            if ($result && $result->num_rows > 0) {
                $sqlBackup .= "-- Dumping data for table `$table`\n";
                $sqlBackup .= "-- --------------------------------------------------------\n\n";

                while ($row = $result->fetch_assoc()) {
                    $columns = array_keys($row);
                    $values = array_map(function($value) use ($conn) {
                        return $value === null ? 'NULL' : "'" . $conn->real_escape_string($value) . "'";
                    }, array_values($row));

                    $sqlBackup .= "INSERT INTO `$table` (`" . implode("`, `", $columns) . "`) VALUES (" . implode(", ", $values) . ");\n";
                }
                $sqlBackup .= "\n";
            }
        }

        $sqlBackup .= "COMMIT;\n";

        echo json_encode([
            'success' => true,
            'type' => 'sql',
            'data' => $sqlBackup,
            'filename' => 'pos_backup_' . date('Y-m-d_H-i-s') . '.sql'
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error generating SQL backup: ' . $e->getMessage()
        ]);
    }
}

$conn->close();
?>