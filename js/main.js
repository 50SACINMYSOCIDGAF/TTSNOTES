// js/main.js
let isRecording = false;
let isPaused = false;
let mediaRecorder;
let audioChunks = [];
let recordingInterval;
const CHUNK_DURATION = 60000;
let chunkCounter = 0;
let pauseTime = 0;
let resumeTime = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startRecording').addEventListener('click', startRecording);
    document.getElementById('stopRecording').addEventListener('click', stopRecording);
    document.getElementById('pauseRecording').addEventListener('click', togglePause);
    loadPastSummaries();
});

async function startRecording() {
    const lectureName = document.getElementById('lectureName').value;
    if (!lectureName) {
        alert('Please enter a lecture name');
        return;
    }

    isRecording = true;
    isPaused = false;
    chunkCounter = 0;
    audioChunks = [];
    document.getElementById('startRecording').disabled = true;
    document.getElementById('stopRecording').disabled = false;
    document.getElementById('pauseRecording').disabled = false;
    document.getElementById('pauseRecording').textContent = 'Pause';
    document.getElementById('status').textContent = 'Recording...';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            if (audioChunks.length > 0) {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await saveAndTranscribeAudio(audioBlob, chunkCounter);
                audioChunks = [];
                chunkCounter++;
            }
            if (isRecording && !isPaused) {
                startNewChunk();
            }
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
    await summarizeTranscript();
    loadPastSummaries(); // Reload past summaries after stopping recording
}

async function saveAndTranscribeAudio(audioBlob, chunkNumber) {
    const formData = new FormData();
    formData.append('audio', audioBlob, `recording_${chunkNumber}.webm`);
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

        // Check if we need to delete the oldest chunk
        if (chunkNumber >= 5) {
            await deleteOldestChunk();
        }
    } catch (error) {
        console.error('Error saving and transcribing audio:', error);
        document.getElementById('status').textContent = `Error processing chunk ${chunkNumber}`;
    }
}

async function deleteOldestChunk() {
    const lectureName = document.getElementById('lectureName').value;
    const oldestChunkNumber = chunkCounter - 5;

    try {
        const response = await fetch('php/delete_chunk.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lectureName, chunkNumber: oldestChunkNumber })
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to delete oldest chunk');
        }
        console.log('Oldest chunk deleted successfully');
    } catch (error) {
        console.error('Error deleting oldest chunk:', error);
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
            await saveSummary(lectureName, result.summary);
            displaySummary(result.summary);
            document.getElementById('status').textContent = 'Summary generated and saved';
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
            body: JSON.stringify({ lectureName, summary })
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to save summary');
        }
        console.log('Summary saved successfully');
    } catch (error) {
        console.error('Error saving summary:', error);
        throw error; // Re-throw to be caught in the calling function
    }
}

function displaySummary(summary) {
    const summaryElement = document.getElementById('summary');
    summaryElement.innerHTML = formatSummary(summary);  // Replace content instead of appending
    summaryElement.style.display = 'block';
}

async function loadPastSummaries() {
    try {
        const response = await fetch('php/get_summaries.php');
        const summaries = await response.json();
        const pastSummariesElement = document.getElementById('pastSummaries');
        pastSummariesElement.innerHTML = '';
        summaries.forEach(summary => {
            const summaryElement = document.createElement('div');
            summaryElement.className = 'past-summary';
            summaryElement.textContent = `${summary.name} (${summary.date})`;
            summaryElement.addEventListener('click', () => loadSummary(summary.file));
            pastSummariesElement.appendChild(summaryElement);
        });
    } catch (error) {
        console.error('Error loading past summaries:', error);
    }
}

async function loadSummary(file) {
    try {
        const response = await fetch(`php/get_summary.php?file=${file}`);
        const summary = await response.text();
        displaySummary(summary);
        showQnAInterface(file);
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

function showQnAInterface(file) {
    const qnaInterface = document.getElementById('qnaInterface');
    qnaInterface.innerHTML = `
        <div id="qnaForm">
            <textarea id="questionInput" rows="3" placeholder="Enter your question"></textarea>
            <button id="submitQuestion">Ask</button>
        </div>
        <div id="answer"></div>
    `;
    qnaInterface.style.display = 'block';

    document.getElementById('submitQuestion').addEventListener('click', () => askQuestion(file));
}

// Update the askQuestion function
async function askQuestion(file) {
    const question = document.getElementById('questionInput').value;
    const summaryElement = document.getElementById('summary');
    const summary = summaryElement.textContent;

    try {
        const response = await fetch('php/ask_question.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ file, question, summary })
        });
        const result = await response.json();
        const answerElement = document.getElementById('answer');
        if (result.success) {
            answerElement.innerHTML = formatSummary(result.answer);
            answerElement.style.display = 'block';
        } else {
            answerElement.innerHTML = '<p>Failed to get an answer. Please try again.</p>';
            answerElement.style.display = 'block';
        }
    } catch (error) {
        console.error('Error asking question:', error);
        const answerElement = document.getElementById('answer');
        answerElement.innerHTML = '<p>An error occurred. Please try again.</p>';
        answerElement.style.display = 'block';
    }
}

// Add the formatSummary function
function formatSummary(summary) {
    return summary.split('\n').map(line => {
        if (line.startsWith('# ')) {
            return `<h2>${line.substring(2)}</h2>`;
        } else if (line.startsWith('## ')) {
            return `<h3>${line.substring(3)}</h3>`;
        } else {
            return `<p>${line}</p>`;
        }
    }).join('');
}

// Update the displaySummary function
function displaySummary(summary) {
    const summaryElement = document.getElementById('summary');
    summaryElement.innerHTML = formatSummary(summary);
    summaryElement.style.display = 'block';
}