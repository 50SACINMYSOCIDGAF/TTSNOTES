<?php
// php/delete_file.php

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

if (isset($input['filename'])) {
    $filename = $input['filename'];
    $filepath = "transcripts/" . $filename;

    if (file_exists($filepath)) {
        if (unlink($filepath)) {
            echo json_encode(['success' => true, 'message' => 'File deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete file']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'File not found']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
}
?>