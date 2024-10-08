<?php
// php/get_summary.php

header('Content-Type: text/plain');

if (isset($_GET['lecture']) && isset($_GET['file'])) {
    $lecture = $_GET['lecture'];
    $file = $_GET['file'];
    $summary_path = __DIR__ . "/../summaries/{$lecture}/{$file}";

    if (file_exists($summary_path)) {
        echo file_get_contents($summary_path);
    } else {
        http_response_code(404);
        echo "Summary not found";
    }
} else {
    http_response_code(400);
    echo "Invalid request";
}
?>