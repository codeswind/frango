<?php
include '../cors.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $uploadDir = '../../uploads/menu/';

    // Create upload directory if it doesn't exist
    if (!file_exists($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create upload directory'
            ]);
            exit;
        }
    }

    if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        $maxSize = 5 * 1024 * 1024; // 5MB

        $fileType = $_FILES['image']['type'];
        $fileSize = $_FILES['image']['size'];
        $fileExtension = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));

        if (!in_array($fileType, $allowedTypes)) {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid file type. Only JPEG, PNG, and GIF are allowed.'
            ]);
            exit;
        }

        if (!in_array($fileExtension, $allowedExtensions)) {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid file extension. Only jpg, jpeg, png, and gif are allowed.'
            ]);
            exit;
        }

        if ($fileSize > $maxSize) {
            echo json_encode([
                'success' => false,
                'message' => 'File size too large. Maximum 5MB allowed.'
            ]);
            exit;
        }

        $fileName = uniqid() . '.' . $fileExtension;
        $filePath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['image']['tmp_name'], $filePath)) {
            echo json_encode([
                'success' => true,
                'message' => 'Image uploaded successfully',
                'image_path' => 'uploads/menu/' . $fileName
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to upload image'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No image file received'
        ]);
    }
}
?>