<?php
// php/save_transcript.php

// Set up OpenAI API credentials
$api_key = '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';

// Handle file upload
if (isset($_FILES['audio']) && isset($_POST['lectureName']) && isset($_POST['chunkNumber'])) {
    $audio_file = $_FILES['audio']['tmp_name'];
    $lecture_name = $_POST['lectureName'];
    $chunk_number = $_POST['chunkNumber'];

    // Generate file names
    $date = date('Y-m-d');
    $chunks_dir = "chunks";
    $transcripts_dir = "transcripts";
    $chunk_file = "{$chunks_dir}/{$lecture_name}_{$date}_chunk_{$chunk_number}.webm";
    $transcript_file = "{$transcripts_dir}/{$lecture_name}_{$date}.txt";

    // Create directories if they don't exist
    if (!file_exists($chunks_dir)) {
        mkdir($chunks_dir, 0777, true);
    }
    if (!file_exists($transcripts_dir)) {
        mkdir($transcripts_dir, 0777, true);
    }

    // Save audio chunk
    if (move_uploaded_file($audio_file, $chunk_file)) {
        // Transcribe audio using OpenAI Whisper API
        $curl = curl_init();
        $curlFile = new CURLFile($chunk_file, 'audio/webm', basename($chunk_file));

        curl_setopt_array($curl, [
            CURLOPT_URL => "https://api.openai.com/v1/audio/transcriptions",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_POSTFIELDS => [
                'file' => $curlFile,
                'model' => 'whisper-1',
                'language' => 'en'  // Specify English language
            ],
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$api_key}"
            ],
        ]);

        $response = curl_exec($curl);
        $err = curl_error($curl);
        $info = curl_getinfo($curl);
        curl_close($curl);

        if ($err) {
            echo json_encode(['success' => false, 'message' => 'Curl error: ' . $err]);
            exit;
        }

        if ($info['http_code'] != 200) {
            echo json_encode(['success' => false, 'message' => 'API error: ' . $response]);
            exit;
        }

        $result = json_decode($response, true);

        if (isset($result['text'])) {
            // Append transcription to the complete transcript file
            file_put_contents($transcript_file, $result['text'] . "\n", FILE_APPEND);
            echo json_encode(['success' => true, 'message' => 'Chunk saved and transcription appended']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Transcription failed: ' . json_encode($result)]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to save audio chunk. PHP error: ' . error_get_last()['message']]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
}
?>