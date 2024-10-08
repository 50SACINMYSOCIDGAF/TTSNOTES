// /main.js
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
    initializeUI();
    loadPastSummaries();
    populateLectureDropdown();
    addSettingsLink();
});

function initializeUI() {
    document.getElementById('startRecording').addEventListener('click', startRecording);
    document.getElementById('stopRecording').addEventListener('click', stopRecording);
    document.getElementById('pauseRecording').addEventListener('click', togglePause);
    document.getElementById('fixStuckFiles').addEventListener('click', fixStuckFiles);
}

function populateLectureDropdown() {
    const lectureSelect = document.getElementById('lectureSelect');
    const userSettings = JSON.parse(localStorage.getItem('userSettings')) || {};
    const lectures = userSettings.lectures || [];

    lectureSelect.innerHTML = '';
    if (lectures.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No lectures available';
        lectureSelect.appendChild(option);
    } else {
        lectures.forEach(lecture => {
            const option = document.createElement('option');
            option.value = lecture;
            option.textContent = lecture;
            lectureSelect.appendChild(option);
        });
    }
}

async function startRecording() {
    const lectureSelect = document.getElementById('lectureSelect');
    const selectedLecture = lectureSelect.value;
    if (!selectedLecture) {
        alert('Please select a lecture');
        return;
    }

    isRecording = true;
    isPaused = false;
    chunkCounter = 0;
    audioChunks = [];
    updateUIForRecordingStart();

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
        updateStatus('Error starting recording');
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
        updateStatus('Paused');
    } else {
        resumeTime = Date.now();
        startNewChunk();
        pauseButton.textContent = 'Pause';
        updateStatus('Recording...');
    }
}

async function stopRecording() {
    isRecording = false;
    isPaused = false;
    clearTimeout(recordingInterval);
    updateUIForRecordingStop();

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
    formData.append('lectureName', document.getElementById('lectureSelect').value);
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
        updateStatus(`Chunk ${chunkNumber} processed successfully`);

        // Check if we need to delete the oldest chunk
        if (chunkNumber >= 5) {
            await deleteOldestChunk();
        }
    } catch (error) {
        console.error('Error saving and transcribing audio:', error);
        updateStatus(`Error processing chunk ${chunkNumber}`);
    }
}

async function deleteOldestChunk() {
    const lectureName = document.getElementById('lectureSelect').value;
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
    const lectureName = document.getElementById('lectureSelect').value;
    updateStatus('Generating summary...');
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
            updateStatus('Summary generated and saved');
        } else {
            throw new Error(result.error || 'Failed to summarize transcript');
        }
    } catch (error) {
        console.error('Error summarizing transcript:', error);
        updateStatus('Error generating summary');
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
    summaryElement.innerHTML = formatSummary(summary);
    summaryElement.style.display = 'block';
}

async function loadPastSummaries() {
    try {
        const response = await fetch('php/get_summaries.php');
        const lectures = await response.json();
        const pastSummariesElement = document.getElementById('pastSummaries');
        pastSummariesElement.innerHTML = '';

        lectures.forEach(lecture => {
            const lectureElement = document.createElement('div');
            lectureElement.className = 'lecture-folder';
            lectureElement.innerHTML = `<h3>${lecture.name}</h3>`;

            const summariesList = document.createElement('ul');
            lecture.summaries.forEach(summary => {
                const summaryElement = document.createElement('li');
                summaryElement.className = 'past-summary';
                summaryElement.textContent = `${summary.topic} (${summary.date})`;
                summaryElement.addEventListener('click', () => loadSummary(lecture.name, summary.file));
                summariesList.appendChild(summaryElement);
            });

            lectureElement.appendChild(summariesList);
            pastSummariesElement.appendChild(lectureElement);
        });
    } catch (error) {
        console.error('Error loading past summaries:', error);
    }
}

async function loadSummary(lectureName, file) {
    try {
        const response = await fetch(`php/get_summary.php?lecture=${lectureName}&file=${file}`);
        const summary = await response.text();
        displaySummary(summary);
        showQnAInterface(lectureName, file);
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

function showQnAInterface(lectureName, file) {
    const qnaInterface = document.getElementById('qnaInterface');
    qnaInterface.innerHTML = `
        <div id="qnaForm">
            <textarea id="questionInput" rows="3" placeholder="Enter your question"></textarea>
            <button id="submitQuestion">Ask</button>
        </div>
        <div id="answer"></div>
    `;
    qnaInterface.style.display = 'block';

    document.getElementById('submitQuestion').addEventListener('click', () => askQuestion(lectureName, file));
}

async function askQuestion(lectureName, file) {
    const question = document.getElementById('questionInput').value;
    const summaryElement = document.getElementById('summary');
    const summary = summaryElement.textContent;

    try {
        const response = await fetch('php/ask_question.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lectureName, file, question, summary })
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

function markdownToHtml(markdown) {
    let html = markdown
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^\*\*(.*)\*\*/gm, '<strong>$1</strong>')
        .replace(/^\*(.*)\*/gm, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/\n\n/g, '<br><br>');

    // Handle nested lists
    let listLevel = 0;
    html = html.replace(/^( *)- (.*$)/gm, (match, spaces, content) => {
        const level = spaces.length / 2;
        let result = '';

        if (level > listLevel) {
            result += '<ul>'.repeat(level - listLevel);
        } else if (level < listLevel) {
            result += '</ul>'.repeat(listLevel - level);
        }

        result += `<li>${content}</li>`;
        listLevel = level;

        return result;
    });

    // Close any remaining list tags
    html += '</ul>'.repeat(listLevel);

    return html;
}

function copyFormattedText(text) {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = markdownToHtml(text);
    tempElement.style.position = 'absolute';
    tempElement.style.left = '-9999px';
    document.body.appendChild(tempElement);

    // Preserve line breaks and indentation in code blocks
    const codeBlocks = tempElement.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
        block.innerText = block.innerHTML;
    });

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(tempElement);
    selection.removeAllRanges();
    selection.addRange(range);

    let success = false;
    try {
        success = document.execCommand('copy');
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }

    document.body.removeChild(tempElement);
    return success;
}

function formatSummary(summary) {
    const htmlContent = markdownToHtml(summary);

    let formattedContent = '<div class="summary-content">';
    formattedContent += '<div class="copy-container">';
    formattedContent += '<button id="copySummaryBtn" class="copy-button">Copy Summary</button>';
    formattedContent += '<span id="copyStatus" class="copy-status"></span>';
    formattedContent += '</div>';
    formattedContent += '<div class="summary-text">';
    formattedContent += htmlContent;
    formattedContent += '</div>';
    formattedContent += '</div>';

    setTimeout(() => {
        const copyButton = document.getElementById('copySummaryBtn');
        const copyStatus = document.getElementById('copyStatus');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                const success = copyFormattedText(summary);
                if (success) {
                    copyStatus.textContent = 'Copied!';
                    copyStatus.style.opacity = '1';
                    setTimeout(() => {
                        copyStatus.style.opacity = '0';
                    }, 2000);
                } else {
                    copyStatus.textContent = 'Copy failed';
                    copyStatus.style.opacity = '1';
                    setTimeout(() => {
                        copyStatus.style.opacity = '0';
                    }, 2000);
                }
            });
        }
    }, 0);

    return formattedContent;
}

function addSettingsLink() {
    const container = document.querySelector('.container');
    if (!container) return;

    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'settings-container';

    const settingsLink = document.createElement('a');
    settingsLink.href = 'settings.html';
    settingsLink.textContent = 'Settings';
    settingsLink.className = 'settings-link';

    const settingsIndicator = document.createElement('span');
    settingsIndicator.className = 'settings-indicator';

    settingsContainer.appendChild(settingsLink);
    settingsContainer.appendChild(settingsIndicator);
    container.appendChild(settingsContainer);

    // Check if settings are saved and update the indicator
    const userSettings = JSON.parse(localStorage.getItem('userSettings')) || {};
    if (userSettings.degree && userSettings.lectures && userSettings.lectures.length > 0) {
        settingsIndicator.textContent = ' ✓';
        settingsIndicator.title = 'Settings configured';
        settingsIndicator.className = 'settings-indicator configured';
    } else {
        settingsIndicator.textContent = ' X';
        settingsIndicator.title = 'Settings not configured';
        settingsIndicator.className = 'settings-indicator not-configured';
    }
}

// CSS styles
const styles = `
    .summary-content {
        position: relative;
        border: 1px solid #ccc;
        padding: 30px;
        margin-top: 20px;
        background-color: #f9f9f9;
    }
    .copy-container {
        position: absolute;
        top: 0;
        right: 0;
        padding: 10px;
        background-color: #f0f0f0;
        border-bottom-left-radius: 5px;
        z-index: 1;
    }
    .copy-button {
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 8px 16px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 14px;
        cursor: pointer;
        border-radius: 4px;
    }
    .copy-status {
        position: absolute;
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        margin-right: 10px;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
        white-space: nowrap;
        font-size: 14px;
    }
    .summary-text {
        margin-top: 40px;
    }
    .settings-container {
        margin-top: 20px;
        text-align: right;
    }
    .settings-link {
        display: inline-block;
        padding: 8px 16px;
        background-color: #4CAF50;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-size: 14px;
    }
    .settings-indicator {
        margin-left: 5px;
        font-weight: bold;
    }
    .settings-indicator.configured {
        color: #4CAF50;
    }
    .settings-indicator.not-configured {
        color: #f44336;
    }
`;

// Append styles to the document head
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

function updateUIForRecordingStart() {
    document.getElementById('startRecording').disabled = true;
    document.getElementById('stopRecording').disabled = false;
    document.getElementById('pauseRecording').disabled = false;
    document.getElementById('pauseRecording').textContent = 'Pause';
    updateStatus('Recording...');
}

function updateUIForRecordingStop() {
    document.getElementById('startRecording').disabled = false;
    document.getElementById('stopRecording').disabled = true;
    document.getElementById('pauseRecording').disabled = true;
    updateStatus('Recording stopped. Processing final chunk...');
}

function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

async function fixStuckFiles() {
    try {
        const response = await fetch('php/fix_stuck_files.php', {
            method: 'POST'
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
        } else {
            throw new Error(result.message || 'Failed to fix stuck files');
        }
    } catch (error) {
        console.error('Error fixing stuck files:', error);
        alert('Error fixing stuck files. Please try again.');
    }
}

