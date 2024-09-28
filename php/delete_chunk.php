<?php
// php/delete_chunk.php

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

if (isset($input['lectureName']) && isset($input['chunkNumber'])) {
    $lecture_name = $input['lectureName'];
    $chunk_number = $input['chunkNumber'];
    $date = date('Y-m-d');
    $chunk_file = "chunks/{$lecture_name}_{$date}_chunk_{$chunk_number}.webm";

    if (file_exists($chunk_file)) {
        if (unlink($chunk_file)) {
            echo json_encode(['success' => true, 'message' => 'Oldest chunk deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete oldest chunk']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Chunk file not found']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
}
?>