<?php
// php/clear_cache.php

header('Content-Type: application/json');

function deleteDirectory($dir) {
    if (!file_exists($dir)) {
        return true;
    }

    if (!is_dir($dir)) {
        return unlink($dir);
    }

    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') {
            continue;
        }

        if (!deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) {
            return false;
        }
    }

    return rmdir($dir);
}

try {
    $chunks_dir = "chunks";
    $transcripts_dir = "transcripts";

    $chunks_deleted = deleteDirectory($chunks_dir);
    $transcripts_deleted = deleteDirectory($transcripts_dir);

    if ($chunks_deleted && $transcripts_deleted) {
        echo json_encode(['success' => true, 'message' => 'Cache cleared successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to clear some parts of the cache']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error clearing cache: ' . $e->getMessage()]);
}
?>