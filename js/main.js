// js/main.js
let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let recordingInterval;
const CHUNK_DURATION = 60000; // 1 minute in milliseconds
const MAX_CHUNKS = 5; // Keep last 5 minutes
let chunkCounter = 0;

document.getElementById('startRecording').addEventListener('click', startRecording);
document.getElementById('stopRecording').addEventListener('click', stopRecording);

async function startRecording() {
    const lectureName = document.getElementById('lectureName').value;
    if (!lectureName) {
        alert('Please enter a lecture name');
        return;
    }

    isRecording = true;
    document.getElementById('startRecording').disabled = true;
    document.getElementById('stopRecording').disabled = false;
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
            if (chunkCounter > MAX_CHUNKS) {
                deleteOldestChunk(chunkCounter - MAX_CHUNKS);
            }
        };

        mediaRecorder.start();

        recordingInterval = setInterval(() => {
            if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                mediaRecorder.start();
            }
        }, CHUNK_DURATION);

    } catch (error) {
        console.error('Error starting recording:', error);
        document.getElementById('status').textContent = 'Error starting recording';
    }
}

function stopRecording() {
    isRecording = false;
    clearInterval(recordingInterval);
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    document.getElementById('startRecording').disabled = false;
    document.getElementById('stopRecording').disabled = true;
    document.getElementById('status').textContent = 'Recording stopped. Summarizing...';

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
    } catch (error) {
        console.error('Error saving and transcribing audio:', error);
        document.getElementById('status').textContent = 'Error transcribing audio';
    }
}

async function deleteOldestChunk(chunkNumber) {
    const lectureName = document.getElementById('lectureName').value;
    try {
        const response = await fetch('php/delete_chunk.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lectureName: lectureName, chunkNumber: chunkNumber })
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to delete oldest chunk');
        }
    } catch (error) {
        console.error('Error deleting oldest chunk:', error);
    }
}

async function summarizeTranscript() {
    const lectureName = document.getElementById('lectureName').value;
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
            document.getElementById('status').textContent = 'Summary generated and saved';

            // Save the summary
            await saveSummary(lectureName, result.summary);
        } else {
            throw new Error(result.error || 'Failed to summarize transcript');
        }
    } catch (error) {
        console.error('Error summarizing transcript:', error);
        document.getElementById('status').textContent = 'Error generating summary';
    }
}

async function saveSummary(lectureName, summary) {
    try {
        const response = await fetch('php/save_summary.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lectureName: lectureName, summary: summary })
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to save summary');
        }
    } catch (error) {
        console.error('Error saving summary:', error);
        document.getElementById('status').textContent += ' (Error saving summary file)';
    }
}