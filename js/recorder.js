// js/recorder.js
let mediaRecorder;
let audioChunks = [];

async function startAudioRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };

    mediaRecorder.start();
}

function stopAudioRecording() {
    return new Promise(resolve => {
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
            audioChunks = [];
            resolve(audioBlob);
        };
        mediaRecorder.stop();
    });
}

async function saveAndTranscribeAudio() {
    const audioBlob = await stopAudioRecording();
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.mp3');
    formData.append('lectureName', document.getElementById('lectureName').value);

    try {
        const response = await fetch('php/save_transcript.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Transcription result:', result);
        // Restart recording if still in recording state
        if (isRecording) {
            startAudioRecording();
        }
    } catch (error) {
        console.error('Error saving and transcribing audio:', error);
    }
}