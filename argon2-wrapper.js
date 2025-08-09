<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <title>Sadat Digital Banknote (Falcon-1024 + SHAKE256)</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@700&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
    <style>
        :root {
            --primary-font: 'Poppins', 'Segoe UI', sans-serif;
            --mono-font: 'Roboto Mono', monospace;
            --dark-bg: #10101a;
            --medium-bg: #1a1a2e;
            --light-bg: #2a2a3e;
            --accent-color-1: #e040fb;
            --accent-color-2: #7c4dff;
            --text-color: #e0e0e0;
            --text-muted: #a0a0c0;
            --success-color: #00e676;
            --error-color: #ff5252;
            --info-color: #40c4ff;
            --border-color: rgba(124, 77, 255, 0.2);
        }
        body { margin: 0; font-family: var(--primary-font); background-color: var(--dark-bg); background-image: radial-gradient(at 0% 0%, hsla(253, 100%, 15%, 0.3) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(263, 100%, 20%, 0.3) 0px, transparent 50%); color: var(--text-color); text-align: center; padding: 24px; }
        .container { max-width: 900px; margin: 0 auto; background: rgba(26, 26, 46, 0.7); backdrop-filter: blur(12px); padding: 24px; border-radius: 24px; border: 1px solid var(--border-color); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); }
        .header { border-bottom: 1px solid var(--border-color); padding-bottom: 16px; margin-bottom: 24px; }
        h1 { font-size: 2.5rem; font-weight: 600; color: #fff; margin: 0 0 8px 0; letter-spacing: 1px; background: linear-gradient(90deg, var(--accent-color-1), var(--accent-color-2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .header p { font-size: 1rem; color: var(--text-muted); margin: 0; }
        canvas { border-radius: 16px; margin-top: 24px; background: #050508; cursor: default; box-shadow: 0 0 50px rgba(124, 77, 255, 0.15); width: 100%; max-width: 900px; height: auto; border: 1px solid var(--border-color); }
        input[type="number"], button, label { padding: 14px 22px; font-size: 16px; font-family: var(--primary-font); border-radius: 12px; margin: 8px 5px; border: 1px solid var(--border-color); background: var(--medium-bg); color: #fff; transition: all 0.3s ease; cursor: pointer; outline: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        input[type="number"] { font-family: var(--mono-font); font-weight: 700; text-align: center; width: 150px; }
        input[type="number"]:focus { border-color: var(--accent-color-2); box-shadow: 0 0 15px rgba(124, 77, 255, 0.5); }
        button:not([disabled]), label:not([disabled]) { font-weight: 600; background: linear-gradient(90deg, var(--accent-color-1), var(--accent-color-2)); border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        button.sub-button, label.sub-button { background: var(--light-bg); border: 1px solid var(--border-color); }
        button[disabled], label[disabled] { cursor: not-allowed; opacity: 0.5; background: var(--light-bg); border: 1px solid var(--border-color); }
        button:hover:not([disabled]), label:hover:not([disabled]) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124, 77, 255, 0.4); }
        .section { background: rgba(16, 16, 26, 0.5); padding: 20px; margin-top: 30px; border-radius: 16px; border: 1px solid var(--border-color); }
        h2 { font-size: 1.5rem; color: var(--text-color); margin-top: 0; margin-bottom: 20px; font-weight: 600; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
        .controls-grid { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 16px; }
        #validation-result, #key-status, #load-stats { margin-top: 20px; font-size: 12px; font-weight: normal; min-height: 50px; line-height: 1.6; text-align: left; background: var(--dark-bg); padding: 15px 20px; border-radius: 12px; white-space: pre-wrap; font-family: var(--mono-font); border: 1px solid var(--border-color); transition: all 0.3s ease; }
        .valid { color: var(--success-color); } .invalid { color: var(--error-color); } .info { color: var(--info-color); }
        code { background: var(--medium-bg); padding: 2px 6px; border-radius: 4px; font-size: 1em; }
        .input-label { font-size: 0.9rem; color: var(--text-muted); margin-right: -10px; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>Sadat Digital Banknote</h1>
        <p>A secure, verifiable digital currency concept using Falcon-1024 Signatures and SHAKE256 Hashing.</p>
    </div>

    <div class="section" id="load-status-section">
        <h2>Loading Status</h2>
        <div id="load-stats">Initializing...</div>
    </div>

    <canvas id="noteCanvas" width="1350" height="750"></canvas>

    <div class="section">
        <h2>Banknote Controls</h2>
        <div class="controls-grid">
            <span class="input-label">Amount:</span>
            <input type="number" id="amount-input" value="50000">
            <span class="input-label">Quantity:</span>
            <input type="number" id="quantity-input" value="1" min="1" max="100">
            <button id="create-note-button" disabled>🎨 Redesign Banknote</button>
            <button id="download-batch-button" disabled>📥 Download Batch</button>
        </div>
    </div>

    <div class="section">
        <h2>Bank Key Management</h2>
        <div class="controls-grid">
            <button id="generate-keys-button">🔑 Generate & Export Keys</button>
            <label for="import-public-key" class="sub-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Import Public Key
            </label>
            <input type="file" id="import-public-key" accept=".json" style="display: none;">
            <label for="import-private-key" class="sub-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Import Private Key
            </label>
            <input type="file" id="import-private-key" accept=".json" style="display: none;">
        </div>
        <div id="key-status">Key pair status will be displayed here.</div>
    </div>

    <div class="section" id="validator-section">
        <h2>Validate Banknote</h2>
        <label for="validator-input">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Select Image for Validation
        </label>
        <input type="file" id="validator-input" accept="image/png" style="display: none;">
        <div id="validation-result">Validation result will be displayed here.</div>
    </div>
</div>

<script type="module">
// Import cryptographic libraries as modules
import pqcSignFalcon1024 from './pqc-sign-falcon-1024.min.js';
import { shake256 } from 'https://cdn.skypack.dev/js-sha3';
import { Argon2 } from './argon2-wrapper.js';

// --- Global State ---
const canvas = document.getElementById("noteCanvas");
const ctx = canvas.getContext("2d");
let currentNoteData = {};
let activeKeys = { publicKey: null, privateKey: null };
let falconApi = null;

// --- Utility Functions ---
const arrayBufferToBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const base64ToUint8Array = (base64) => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
};
const hexToUint8Array = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
const uint8ArrayToHex = (bytes) => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

// ===================================================================================
// Bank Key Management and Falcon-1024 Crypto Logic
// ===================================================================================

const BankCrypto = (() => {
    const AES_ALGO = "AES-GCM";
    const AES_KEY_LENGTH = 256;
    const ARGON2_KEY_LENGTH = 32; // 256 bits

    function hashMessageForSigning(message) {
        const hexHash = shake256(message, 1536);
        return hexToUint8Array(hexHash);
    }

    function hashMessageForVisual(message) {
        return shake256(message, 256);
    }
    
    async function generateNewKeyPair() {
        if (!falconApi) throw new Error("Falcon API not initialized.");
        return await falconApi.keypair();
    }

    async function signData(data, privateKey) {
        if (!privateKey) throw new Error("Private key is not available for signing.");
        if (!falconApi) throw new Error("Falcon API not initialized.");
        const dataHash = hashMessageForSigning(data);
        const { signature } = await falconApi.sign(dataHash, privateKey);
        return signature;
    }

    async function verifySignature(signature, data, publicKey) {
        if (!publicKey) throw new Error("Public key is not available for verification.");
        if (!falconApi) throw new Error("Falcon API not initialized.");
        const dataHash = hashMessageForSigning(data);
        return await falconApi.verify(signature, dataHash, publicKey);
    }
    
    async function argon2DeriveKey(password, salt) {
        const passwordBytes = new TextEncoder().encode(password);
        const saltBytes = new TextEncoder().encode(salt);
        
        const result = await Argon2.hash({
            pass: passwordBytes,
            salt: saltBytes,
            time: 3,        // Iterations
            mem: 2048,      // Memory in KB (2MB)
            parallelism: 1, // Threads
            hashLen: ARGON2_KEY_LENGTH,
            type: Argon2.ArgonType.Argon2id // Recommended type
        });
        
        return result.hash;
    }
    
    async function encryptPrivateKey(privateKeyBytes, password) {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        const keyMaterial = await argon2DeriveKey(password, salt);
        const derivedKey = await window.crypto.subtle.importKey("raw", keyMaterial, { name: AES_ALGO }, false, ["encrypt"]);
        
        const keyObject = { keyData: arrayBufferToBase64(privateKeyBytes) };
        const encodedKey = new TextEncoder().encode(JSON.stringify(keyObject));
        
        const encryptedKey = await window.crypto.subtle.encrypt({ name: AES_ALGO, iv: iv }, derivedKey, encodedKey);
        
        return {
            cipherText: arrayBufferToBase64(encryptedKey),
            salt: arrayBufferToBase64(salt),
            iv: arrayBufferToBase64(iv)
        };
    }
    
    async function decryptPrivateKey(encryptedData, password) {
        const salt = base64ToUint8Array(encryptedData.salt);
        const iv = base64ToUint8Array(encryptedData.iv);
        const cipherText = base64ToUint8Array(encryptedData.cipherText);
        
        const keyMaterial = await argon2DeriveKey(password, salt);
        const derivedKey = await window.crypto.subtle.importKey("raw", keyMaterial, { name: AES_ALGO }, false, ["decrypt"]);
        
        const decryptedKeyBuffer = await window.crypto.subtle.decrypt({ name: AES_ALGO, iv: iv }, derivedKey, cipherText);
        const keyObject = JSON.parse(new TextDecoder().decode(decryptedKeyBuffer));
        
        return base64ToUint8Array(keyObject.keyData);
    }

    return { generateNewKeyPair, signData, verifySignature, encryptPrivateKey, decryptPrivateKey, hashMessageForVisual };
})();

function getStandardizedDataForSigning(noteData) {
    const dataToSign = { amount: noteData.amount, serial: noteData.serial, timestamp: noteData.timestamp, verificationKey: noteData.verificationKey };
    return JSON.stringify(dataToSign, Object.keys(dataToSign).sort());
}

/**
 * Creates a compact, pipe-delimited string payload to reduce QR code size.
 * @param {object} noteData - The banknote data object.
 * @returns {string} The compressed payload string.
 */
function createQrPayload(noteData) {
    const parts = [
        noteData.amount,
        noteData.serial,
        noteData.timestamp,
        noteData.verificationKey,
        noteData.signature
    ];
    return parts.join('|');
}

function updateKeyStatus(message) { document.getElementById('key-status').innerHTML = message; }
function updateControlsState(isEnabled) {
    document.getElementById('create-note-button').disabled = !isEnabled;
    document.getElementById('download-batch-button').disabled = !isEnabled;
}

// ===================================================================================
// UI Handlers for Key Management
// ===================================================================================
async function handleGenerateAndExportKeys() {
    const password = prompt("Enter a strong password to encrypt your private key file:");
    if (!password) {
        updateKeyStatus('<span class="invalid">❌ Key generation cancelled. Password is required.</span>');
        return;
    }
    
    // Check if Argon2 module is initialized
    if (!Argon2.isReady) {
        updateKeyStatus('<span class="invalid">❌ Argon2 module is not ready. Please wait a moment and try again.</span>');
        return;
    }
    
    updateKeyStatus('<span class="info">⏳ Generating new Falcon-1024 key pair...</span>');
    try {
        const keyPair = await BankCrypto.generateNewKeyPair();
        activeKeys.publicKey = keyPair.publicKey;
        activeKeys.privateKey = keyPair.privateKey;
        
        updateKeyStatus('<span class="info">⏳ Encrypting private key with Argon2 and AES... This may take a moment.</span>');
        const publicKeyB64 = arrayBufferToBase64(keyPair.publicKey);
        downloadFile(JSON.stringify({ keyData: publicKeyB64 }, null, 2), 'Sadat-Falcon-public-key.json', 'application/json');
        
        const encryptedPrivate = await BankCrypto.encryptPrivateKey(keyPair.privateKey, password);
        downloadFile(JSON.stringify(encryptedPrivate, null, 2), 'Sadat-Falcon-private-key.json', 'application/json');
        
        updateKeyStatus('<span class="valid">✅ New Falcon-1024 key pair generated and exported! The new keys are now active.</span>');
        updateControlsState(true);
        await handleCreateNewNote();
    } catch (e) {
        console.error("Key generation failed:", e);
        updateKeyStatus(`<span class="invalid">❌ Failed to generate keys: ${e.message}</span>`);
    }
}

async function handleImportPublicKey(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.keyData) throw new Error("Invalid public key file format.");
            activeKeys.publicKey = base64ToUint8Array(data.keyData);
            updateKeyStatus('<span class="valid">✅ Public key imported successfully. It is now active for banknote validation.</span>');
        } catch (error) {
            updateKeyStatus(`<span class="invalid">❌ Error importing public key: ${error.message}</span>`);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

async function handleImportPrivateKey(event) {
    const file = event.target.files[0];
    if (!file) return;
    const password = prompt("Enter the password to decrypt the private key file:");
    if (!password) {
        updateKeyStatus('<span class="invalid">❌ Import cancelled. Password is required to decrypt.</span>');
        return;
    }
    
    // Check if Argon2 module is initialized
    if (!Argon2.isReady) {
        updateKeyStatus('<span class="invalid">❌ Argon2 module is not ready. Please wait a moment and try again.</span>');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const encryptedData = JSON.parse(e.target.result);
            updateKeyStatus('<span class="info">⏳ Decrypting private key with Argon2 and AES... This may take a moment.</span>');
            activeKeys.privateKey = await BankCrypto.decryptPrivateKey(encryptedData, password);
            updateKeyStatus('<span class="valid">✅ Private key imported successfully. It is now active for banknote signing.</span>');
            updateControlsState(true);
        } catch (error) {
            updateKeyStatus(`<span class="invalid">❌ Error decrypting or importing private key. Check your password and file: ${error.message}</span>`);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function downloadFile(data, filename, type) {
    const blob = new Blob([data], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ===================================================================================
// Validation Logic
// ===================================================================================
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!activeKeys.publicKey) {
        alert("Error: No public key is active for validation. Please generate or import one.");
        return;
    }
    const resultDiv = document.getElementById('validation-result');
    resultDiv.innerHTML = `<span class="info">⏳ Preparing image for validation...</span>`;
    const fileUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1350; tempCanvas.height = 750;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

        resultDiv.innerHTML = `<span class="info">1. Reading digital data from QR Code...</span>`;
        const qrData = readQRCodeFromCanvas(tempCanvas);
        if (!qrData) {
            resultDiv.innerHTML = `<span class="invalid">❌ FATAL ERROR: QR Code not found or unreadable.</span>`;
            return;
        }

        let resultHTML = `<span class="valid">✅ 1. QR data successfully read.</span>`;
        resultHTML += `\n\n<span class="info">2. Verifying digital signature (Falcon-1024)...</span>`;
        resultDiv.innerHTML = resultHTML;

        const isSignatureValid = await validateDigitalSignature(qrData);
        if (!isSignatureValid) {
            resultHTML += `\n<span class="invalid">❌ FATAL ERROR: Digital signature is invalid. Forgery detected.</span>`;
            resultHTML += `\n<hr style="border-color: var(--border-color); border-style: dashed; margin: 15px 0 10px;">\n<span style="font-size: 14px; font-weight: 600;">❌ VERDICT: Forgery detected.</span>`;
            resultDiv.innerHTML = resultHTML;
            return;
        }

        resultHTML += `\n<span class="valid">✅ 2. Digital signature confirmed. Authenticity verified.</span>`;
        resultHTML += `\n<hr style="border-color: var(--border-color); border-style: dashed; margin: 15px 0 10px;">\n<span style="font-size: 14px; font-weight: 600;">✅ VERDICT: Banknote is authentic.</span>`;
        resultDiv.innerHTML = resultHTML;
    };
    img.src = fileUrl;
    event.target.value = '';
}

async function validateDigitalSignature(qrData) {
    try {
        const { signature } = qrData;
        if (!signature || !activeKeys.publicKey) return false;
        const stringToVerify = getStandardizedDataForSigning(qrData);
        const signatureBytes = base64ToUint8Array(signature);
        return await BankCrypto.verifySignature(signatureBytes, stringToVerify, activeKeys.publicKey);
    } catch (e) {
        console.error("Signature verification error:", e);
        return false;
    }
}

function readQRCodeFromCanvas(canvasToCheck) {
    const context = canvasToCheck.getContext('2d');
    const qrRegion = { x: 800, y: 210, width: 420, height: 420 };
    const imageData = context.getImageData(qrRegion.x, qrRegion.y, qrRegion.width, qrRegion.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code && code.data) {
        try {
            const parts = code.data.split('|');
            if (parts.length !== 5) return null; // Verify correct format

            return {
                amount: parseInt(parts[0], 10),
                serial: parts[1],
                timestamp: parseInt(parts[2], 10),
                verificationKey: parts[3],
                signature: parts[4]
            };
        } catch {
            return null;
        }
    }
    return null;
}

// ===================================================================================
// Banknote Creation Logic
// ===================================================================================
const H = (text, index, min, max) => min + (parseInt(text.substring(index, index + 2), 16) % (max - min + 1));

async function createNoteData(amount, index = 0) {
    if (!activeKeys.privateKey) {
        alert("Error: No private key is active for signing banknotes. Please generate or import a private key.");
        return null;
    }
    const now = Date.now();
    const noteData = {
        amount: parseInt(amount) || 0,
        verificationKey: Math.random().toString(16).substring(2, 10).toUpperCase(),
        serial: (now + index).toString().slice(-8),
        timestamp: now
    };
    const stringToSign = getStandardizedDataForSigning(noteData);
    const signatureBytes = await BankCrypto.signData(stringToSign, activeKeys.privateKey);
    noteData.signature = arrayBufferToBase64(signatureBytes);
    noteData.visualHash = BankCrypto.hashMessageForVisual(noteData.signature);
    return noteData;
}

async function handleCreateNewNote() {
    const amount = document.getElementById("amount-input").value;
    updateKeyStatus('<span class="info">⏳ Generating new banknote...</span>');
    const noteData = await createNoteData(amount);
    if (noteData) {
        currentNoteData = noteData;
        await drawNoteOnCanvas(canvas, noteData, canvas.width, canvas.height);
        updateKeyStatus('<span class="valid">✅ New banknote design is ready.</span>');
    } else {
        updateKeyStatus('<span class="invalid">❌ Failed to create a new banknote.</span>');
    }
}

async function handleDownloadBatch() {
    if (!activeKeys.privateKey) {
        alert("Error: No private key is active. Please generate or import one.");
        return;
    }
    if (!window.showDirectoryPicker) {
        alert("Your browser does not support the File System Access API. Downloading a single note as a fallback.");
        await handleCreateNewNote();
        const link = document.createElement("a");
        link.download = `SADAT-NOTE-SECURE-${currentNoteData.serial}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        return;
    }
    const quantity = parseInt(document.getElementById('quantity-input').value) || 1;
    const amount = document.getElementById("amount-input").value;
    const resultDiv = document.getElementById('validation-result');
    try {
        const dirHandle = await window.showDirectoryPicker();
        resultDiv.innerHTML = `<span class="info">Processing ${quantity} banknote(s)... Please wait.</span>`;
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = canvas.width; offscreenCanvas.height = canvas.height;
        for (let i = 0; i < quantity; i++) {
            const noteData = await createNoteData(amount, i);
            if (!noteData) { resultDiv.innerHTML = `<span class="invalid">❌ Batch download stopped. No private key.</span>`; return; }
            await drawNoteOnCanvas(offscreenCanvas, noteData, offscreenCanvas.width, offscreenCanvas.height);
            const blob = await new Promise(resolve => offscreenCanvas.toBlob(resolve, 'image/png'));
            const fileHandle = await dirHandle.getFileHandle(`SADAT-NOTE-SECURE-${noteData.serial}.png`, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            resultDiv.innerHTML = `<span class="info">Successfully saved banknote ${i + 1} of ${quantity}.</span>`;
        }
        resultDiv.innerHTML = `<span class="valid">✅ Successfully saved ${quantity} banknote(s).</span>`;
        await handleCreateNewNote();
    } catch (error) {
        resultDiv.innerHTML = `<span class="invalid">❌ Error: ${error.message}</span>`;
    }
}

async function drawNoteOnCanvas(targetCanvas, noteData, width, height) {
    return new Promise(async (resolve, reject) => {
        if (Object.keys(noteData).length === 0) return reject("No note data provided.");
        const ctx = targetCanvas.getContext("2d");
        const { amount, verificationKey, serial, visualHash } = noteData;
        const w = width, h = height, scale = w / 1350;

        const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
        const baseHue = H(visualHash, 0, 0, 360);
        bgGradient.addColorStop(0, `hsl(${baseHue}, 50%, 6%)`);
        bgGradient.addColorStop(1, `hsl(${baseHue}, 40%, 4%)`);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, w, h);
        
        drawWatermark(ctx, visualHash, w, h);
        drawKochGuilloche(ctx, visualHash, w, h);
        drawNoisePattern(ctx, visualHash, w, h);

        ctx.shadowColor="rgba(0,0,0,0.7)"; ctx.shadowBlur=8*scale; ctx.shadowOffsetX=2*scale; ctx.shadowOffsetY=2*scale;
        ctx.fillStyle="#EAEAEA"; ctx.font=`bold ${80*scale}px 'Roboto Mono'`; ctx.textAlign='left';
        ctx.fillText(serial,150*scale,160*scale); 
        ctx.fillText(verificationKey,150*scale,280*scale);
        ctx.font=`bold ${150*scale}px 'Roboto Mono'`; ctx.textAlign="right";
        ctx.shadowBlur=12*scale; ctx.shadowOffsetX=4*scale; ctx.shadowOffsetY=4*scale;
        ctx.fillText(amount.toString(),w-(120*scale),190*scale); ctx.shadowColor="transparent";

        const qrCanvas = document.createElement("canvas");
        const qrSize = 380 * scale;
        const qrPayload = createQrPayload(noteData);

        QRCode.toCanvas(qrCanvas, qrPayload, { 
            width: qrSize, 
            errorCorrectionLevel: 'M', 
            color: { dark: '#000000', light: '#FFFFFF' } 
        }, (err) => {
            if (err) { reject(err); return; }
            const qrX = w - (150 * scale) - qrSize;
            const qrY = h - (520 * scale);
            ctx.fillStyle = 'white';
            ctx.fillRect(qrX - (20 * scale), qrY - (20 * scale), qrSize + (40 * scale), qrSize + (40 * scale));
            ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

            ctx.font=`${30*scale}px 'Roboto Mono'`; ctx.fillStyle="rgba(255,255,255,0.4)"; ctx.textAlign="center";
            ctx.fillText("Digitally Signed by Sadat Bank Authority (Falcon-1024)", w/2, h-60*scale);
            resolve();
        });
    });
}

function drawKochGuilloche(g_ctx, hash, w, h) { g_ctx.save();g_ctx.translate(w/2,h/2);const s=w/1350,it=H(hash,2,2,4),sz=w*(H(hash,4,10,20)/100),aO=(H(hash,6,0,360)/360)*Math.PI*2,nL=H(hash,8,3,6),hO=H(hash,10,0,360);function d(x1,y1,x2,y2,l){if(l===0){g_ctx.lineTo(x2,y2);return}const dx=x2-x1,dy=y2-y1,di=Math.sqrt(dx*dx+dy*dy),ux=dx/di,uy=dy/di,p1x=x1+ux*di/3,p1y=y1+uy*di/3,p2x=x1+ux*di*2/3,p2y=y1+uy*di*2/3,p3x=p1x+ux*di/6-uy*di*Math.sqrt(3)/6,p3y=p1y+uy*di/6+ux*di*Math.sqrt(3)/6;d(x1,y1,p1x,p1y,l-1);d(p1x,p1y,p3x,p3y,l-1);d(p3x,p3y,p2x,p2y,l-1);d(p2x,y2,x2,y2,l-1)}g_ctx.lineWidth=1*s;g_ctx.lineJoin='bevel';g_ctx.lineCap='round';for(let i=0;i<nL;i++){const hu=(hO+i*(360/nL))%360;g_ctx.strokeStyle=`hsla(${hu},70%,60%,0.15)`;const lA=(i/nL)*Math.PI*2+aO,x1=Math.cos(lA)*sz,y1=Math.sin(lA)*sz,x2=Math.cos(lA+Math.PI)*sz,y2=Math.sin(lA+Math.PI)*sz;g_ctx.beginPath();g_ctx.moveTo(x1,y1);d(x1,y1,x2,y2,it);g_ctx.stroke()}g_ctx.restore() }
function drawWatermark(g_ctx, hash, w, h) { g_ctx.save();g_ctx.translate(w/2,h/2);const s=w/1350,nS=H(hash,16,3,6),sR=w*(H(hash,18,10,25)/100)*s,hu=H(hash,20,0,360);g_ctx.strokeStyle=`hsla(${hu},50%,80%,0.05)`;g_ctx.lineWidth=4*s;for(let i=0;i<nS;i++){g_ctx.beginPath();const sA=(i/nS)*Math.PI*2+H(hash,22,0,100)/100,eA=sA+H(hash,24,6,12)*Math.PI;for(let t=sA;t<eA;t+=0.05){const r=sR*(t-sA)/(eA-sA),x=r*Math.cos(t),y=r*Math.sin(t);if(t===sA)g_ctx.moveTo(x,y);else g_ctx.lineTo(x,y)}g_ctx.stroke()}g_ctx.restore() }
function drawNoisePattern(g_ctx, hash, w, h) { g_ctx.save(); for (let i=0; i<20000; i++) { const x=Math.random()*w, y=Math.random()*h, o=Math.random()*0.15, hue=H(hash,(i%30)+4,0,360); g_ctx.fillStyle=`hsla(${hue},50%,80%,${o})`; g_ctx.fillRect(x,y,1,1) } g_ctx.restore() }

// ===================================================================================
// Application Initialization
// ===================================================================================
function updateLoadStats(message) { document.getElementById('load-stats').innerHTML += message; }

async function main() {
    updateControlsState(false);
    
    const loadStatsDiv = document.getElementById('load-stats');
    loadStatsDiv.innerHTML = ''; // Clear initial "Initializing..." message
    
    try {
        updateLoadStats('<span class="info">⏳ Loading Falcon-1024 crypto module...</span>');
        falconApi = await pqcSignFalcon1024();
        updateLoadStats('<br><span class="valid">✅ Falcon-1024 loaded successfully.</span>');
        
        // Wait for Argon2 WebAssembly to be ready
        updateLoadStats('<br><span class="info">⏳ Loading Argon2 crypto module...</span>');
        await new Promise(resolve => {
            if (Argon2.isReady) {
                resolve();
            } else {
                Argon2.onRuntimeInitialized = () => {
                    Argon2.isReady = true;
                    resolve();
                };
            }
        });
        updateLoadStats('<br><span class="valid">✅ Argon2 loaded successfully.</span>');
        
        updateKeyStatus('<span class="info">Ready. Please generate a new key pair or import existing keys to begin.</span>');
    } catch (e) {
        console.error("Failed to load a required module:", e);
        loadStatsDiv.innerHTML = `<span class="invalid">❌ Critical Error: Could not load required modules. Please check the console and ensure all files are present.</span>`;
        alert("Error: Failed to load a required cryptographic module. See the console for details.");
        return;
    }
    
    document.getElementById('generate-keys-button').addEventListener('click', handleGenerateAndExportKeys);
    document.getElementById('create-note-button').addEventListener('click', handleCreateNewNote);
    document.getElementById('download-batch-button').addEventListener('click', handleDownloadBatch);
    document.getElementById('import-public-key').addEventListener('change', handleImportPublicKey);
    document.getElementById('import-private-key').addEventListener('change', handleImportPrivateKey);
    document.getElementById('validator-input').addEventListener('change', handleFileSelect);
}

// Start the application
main();

</script>
</body>
</html>
