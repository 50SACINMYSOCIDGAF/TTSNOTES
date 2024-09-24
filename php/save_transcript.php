<?php
// php/save_transcript.php

// Set up OpenAI API credentials
$openai_api_key = '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';

// Handle file upload
if (isset($_FILES['audio']) && isset($_POST['lectureName']) && isset($_POST['chunkNumber'])) {
    $audio_file = $_FILES['audio']['tmp_name'];
    $lecture_name = $_POST['lectureName'];
    $chunk_number = $_POST['chunkNumber'];

    // Generate file names
    $date = date('Y-m-d');
    $chunk_file = "chunks/{$lecture_name}_{$date}_chunk_{$chunk_number}.mp3";
    $transcript_file = "transcripts/{$lecture_name}_{$date}.txt";

    // Save audio chunk
    if (move_uploaded_file($audio_file, $chunk_file)) {
        // Transcribe audio using OpenAI Whisper API
        $curl = curl_init();
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
                'file' => new CURLFILE($chunk_file),
                'model' => 'whisper-2'
            ],
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$openai_api_key}"
            ],
        ]);

        $response = curl_exec($curl);
        curl_close($curl);

        $result = json_decode($response, true);

        if (isset($result['text'])) {
            // Append transcription to the complete transcript file
            file_put_contents($transcript_file, $result['text'] . "\n", FILE_APPEND);
            echo json_encode(['success' => true, 'message' => 'Chunk saved and transcription appended']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Transcription failed']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to save audio chunk']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
}
?>