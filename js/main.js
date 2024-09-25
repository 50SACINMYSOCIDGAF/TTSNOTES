// js/main.js
let isRecording = false;
let isPaused = false;
let mediaRecorder;
let audioChunks = [];
let recordingInterval;
const CHUNK_DURATION = 60000; // 1 minute in milliseconds
let chunkCounter = 0;
let pauseTime = 0;
let resumeTime = 0;

document.getElementById('startRecording').addEventListener('click', startRecording);
document.getElementById('stopRecording').addEventListener('click', stopRecording);
document.getElementById('pauseRecording').addEventListener('click', togglePause);

async function startRecording() {
    const lectureName = document.getElementById('lectureName').value;
    if (!lectureName) {
        alert('Please enter a lecture name');
        return;
    }

    isRecording = true;
    isPaused = false;
    document.getElementById('startRecording').disabled = true;
    document.getElementById('stopRecording').disabled = false;
    document.getElementById('pauseRecording').disabled = false;
    document.getElementById('pauseRecording').textContent = 'Pause';
    document.getElementById('status').textContent = 'Recording...';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
            saveAndTranscribeAudio(audioBlob, chunkCounter);
            audioChunks = [];
            chunkCounter++;
        };

        startNewChunk();

    } catch (error) {
        console.error('Error starting recording:', error);
        document.getElementById('status').textContent = 'Error starting recording';
    }
}

function startNewChunk() {
    if (mediaRecorder && mediaRecorder.state === 'inactive' && isRecording && !isPaused) {
        mediaRecorder.start();
        recordingInterval = setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                startNewChunk();
            }
        }, CHUNK_DURATION);
    }
}

function togglePause() {
    if (!isRecording) return;

    isPaused = !isPaused;
    const pauseButton = document.getElementById('pauseRecording');

    if (isPaused) {
        pauseTime = Date.now();
        clearTimeout(recordingInterval);
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        pauseButton.textContent = 'Resume';
        document.getElementById('status').textContent = 'Paused';
    } else {
        resumeTime = Date.now();
        const pauseDuration = resumeTime - pauseTime;
        startNewChunk();
        pauseButton.textContent = 'Pause';
        document.getElementById('status').textContent = 'Recording...';
    }
}

async function stopRecording() {
    isRecording = false;
    isPaused = false;
    clearTimeout(recordingInterval);
    document.getElementById('startRecording').disabled = false;
    document.getElementById('stopRecording').disabled = true;
    document.getElementById('pauseRecording').disabled = true;
    document.getElementById('status').textContent = 'Recording stopped. Processing final chunk...';

    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }

    // Wait for the final chunk to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Now summarize
    summarizeTranscript();
}

async function saveAndTranscribeAudio(audioBlob, chunkNumber) {
    const formData = new FormData();
    formData.append('audio', audioBlob, `recording_${chunkNumber}.mp3`);
    formData.append('lectureName', document.getElementById('lectureName').value);
    formData.append('chunkNumber', chunkNumber);

    try {
        const response = await fetch('php/save_transcript.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Transcription result:', result);
        if (!result.success) {
            throw new Error(result.message || 'Transcription failed');
        }
        document.getElementById('status').textContent = `Chunk ${chunkNumber} processed successfully`;
    } catch (error) {
        console.error('Error saving and transcribing audio:', error);
        document.getElementById('status').textContent = `Error processing chunk ${chunkNumber}`;
    }
}

async function summarizeTranscript() {
    const lectureName = document.getElementById('lectureName').value;
    document.getElementById('status').textContent = 'Generating summary...';
    try {
        const response = await fetch('php/summarize.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lectureName: lectureName })
        });
        const result = await response.json();
        if (result.success) {
            document.getElementById('summary').textContent = result.summary;
            document.getElementById('status').textContent = 'Summary generated';
        } else {
            throw new Error(result.error || 'Failed to summarize transcript');
        }
    } catch (error) {
        console.error('Error summarizing transcript:', error);
        document.getElementById('status').textContent = 'Error generating summary';
    }
}