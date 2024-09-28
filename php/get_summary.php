<?php
// php/get_summary.php

header('Content-Type: text/plain');

if (isset($_GET['file'])) {
    $file = "../summaries/" . $_GET['file'];
    if (file_exists($file)) {
        echo file_get_contents($file);
    } else {
        http_response_code(404);
        echo "Summary not found";
    }
} else {
    http_response_code(400);
    echo "Invalid request";
}
?>