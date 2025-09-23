import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Chat } from '@google/genai';
import { Sidebar } from './components/Sidebar';
import { ImageCanvas } from './components/ImageCanvas';
import { ChatPanel } from './components/ChatPanel';
import { useImageHistory } from './hooks/useImageHistory';
import * as geminiService from './services/geminiService';
import type { ImageFile, ChatMessage, AttachmentFile } from './types';
import { CloseIcon } from './components/icons';

const fileToDataURL = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
});


const LoadingOverlay: React.FC<{ isLoading: boolean; loadingText: string }> = ({ isLoading, loadingText }) => {
    if (!isLoading) return null;
    return (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center z-50">
            <div className="loader"></div>
            <p className="mt-4 text-lg font-semibold text-text-primary">{loadingText}</p>
            <p className="text-text-secondary">This can take a moment.</p>
        </div>
    );
};

const ErrorToast: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(onDismiss, 5000);
            return () => clearTimeout(timer);
        }
    }, [message, onDismiss]);

    if (!message) return null;
    return (
        <div className="absolute bottom-5 right-5 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform animate-message-in">
            <p>{message}</p>
        </div>
    );
};

const MultiViewModal: React.FC<{ images: ImageFile[]; onClose: () => void; }> = ({ images, onClose }) => (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-surface rounded-lg p-6 shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <h3 className="text-xl font-bold text-text-primary">Four Professional Angles</h3>
                <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors" title="Close"><CloseIcon className="w-5 h-5"/></button>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-4">
                {images.map((img, index) => (
                    <div key={index} className="flex flex-col items-center">
                        <img src={`data:${img.mimeType};base64,${img.data}`} alt={`View ${index + 1}`} className="w-full h-auto object-contain rounded-lg shadow-lg mb-2"/>
                        <span className="text-sm text-text-secondary">{["Front View", "Side View", "Rear View", "Overhead View"][index] || `View ${index + 1}`}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const CodeRunnerModal: React.FC<{ code: string; onClose: () => void; }> = ({ code, onClose }) => (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
        <div className="bg-surface rounded-lg p-4 shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-border mb-2 flex-shrink-0">
                <h3 className="text-lg font-bold text-text-primary">Live Code Preview</h3>
                <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors" title="Close"><CloseIcon className="w-5 h-5"/></button>
            </div>
            <iframe srcDoc={code} className="w-full h-full bg-white border-0 rounded-b-lg flex-grow" sandbox="allow-scripts allow-same-origin"></iframe>
        </div>
    </div>
);


export default function App() {
    // State
    const { currentImage, originalImage, canUndo, isImageLoaded, push, undo, reset } = useImageHistory();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("Applying AI magic...");
    const [error, setError] = useState<string>("");
    const [prompt, setPrompt] = useState("");
    const [isDraftMode, setDraftMode] = useState(true);
    const [brushSize, setBrushSize] = useState(30);
    const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
    const [clearMaskSignal, setClearMaskSignal] = useState(0);

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isChatMaximized, setIsChatMaximized] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [attachment, setAttachment] = useState<AttachmentFile | null>(null);
    const chatSessionRef = useRef<Chat | null>(null);

    // Modal State
    const [multiViewImages, setMultiViewImages] = useState<ImageFile[]>([]);
    const [codeToRun, setCodeToRun] = useState<string | null>(null);
    
    // Handlers
    const handleShowError = (message: string) => {
        console.error(message);
        setError(message);
    };

    const handleImageUpload = useCallback(async (file: File) => {
        if (!file || !file.type || !file.type.startsWith('image/')) {
            handleShowError('Please upload a valid image file.');
            return;
        }
        setIsLoading(true);
        setLoadingText("Processing image...");
        try {
            const dataUrl = await fileToDataURL(file);
            const newImage = { mimeType: file.type, data: dataUrl.split(',')[1] };
            reset(newImage);
        } catch (err) {
            handleShowError("Could not process the uploaded file.");
        } finally {
            setIsLoading(false);
        }
    }, [reset]);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) return;
        if (!currentImage) {
            handleShowError("Please upload an image first to apply an edit.");
            return;
        }
        setIsLoading(true);
        setLoadingText(`Applying "${prompt}"...`);
        try {
            const editedImage = await geminiService.editImage(prompt, currentImage, maskDataUrl ?? undefined, isDraftMode);
            push(editedImage);
            setPrompt("");
            setClearMaskSignal(s => s + 1);
        } catch (err: any) {
            handleShowError(err.message || "An unknown error occurred during editing.");
        } finally {
            setIsLoading(false);
        }
    }, [prompt, currentImage, push, maskDataUrl, isDraftMode]);
    
    const handleMagicEdit = (magicPrompt: string) => {
        setPrompt(magicPrompt);
    };

    useEffect(() => {
        if (prompt && currentImage) {
             if (['Subtly enhance the lighting, color saturation, and sharpness.', 'Professionally remove the background, leaving a transparent background.', 'Apply a cinematic color grade.', 'Convert to a moody black and white.', 'Give a warm, vintage look with faded colors.', 'Restore old photo: remove scratches, fix colors, and improve quality.'].includes(prompt)) {
                handleGenerate();
            }
        }
    }, [prompt, currentImage, handleGenerate]);


    const handleDownload = () => {
        if (!currentImage) return;
        const link = document.createElement('a');
        link.href = `data:${currentImage.mimeType};base64,${currentImage.data}`;
        link.download = 'edited-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleGenerateMultiView = async () => {
        if (!currentImage) return;
        setIsLoading(true);
        setLoadingText("Generating professional views...");
        try {
            const images = await geminiService.generateMultiView(prompt, currentImage);
            setMultiViewImages(images);
        } catch (err: any) {
            handleShowError(err.message || "Failed to generate multi-view images.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Chat Handlers
    const startNewChat = useCallback(() => {
        chatSessionRef.current = geminiService.createChatSession();
        const welcomeMessage = "Hello! I'm your AI creative partner. How can I help you today? You can attach images, documents, or code for analysis.";
        setChatMessages([{ role: "model", content: welcomeMessage }]);
    }, []);
    
    useEffect(() => {
        startNewChat();
    }, [startNewChat]);
    
    const handleAttachmentChange = (file: File | null) => {
        if (!file) {
            setAttachment(null);
            return;
        }
        setAttachment({ file, name: file.name });
    };

    const handleChatSubmit = async (message: string, attachmentFile?: File) => {
        if (!chatSessionRef.current) return;

        let attachmentRenderInfo;
        if (attachmentFile) {
            const url = URL.createObjectURL(attachmentFile);
            attachmentRenderInfo = { url, name: attachmentFile.name, isImage: attachmentFile.type.startsWith('image/') };
        }

        setChatMessages(prev => [...prev, { role: 'user', content: message, attachment: attachmentRenderInfo }]);
        setIsThinking(true);

        try {
            const stream = await geminiService.sendChatMessage(chatSessionRef.current, message, attachmentFile);
            let responseText = "";
            
            setChatMessages(prev => [...prev, { role: "model", content: "" }]);

            for await (const chunk of stream) {
                responseText += chunk.text;
                setChatMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if(lastMessage.role === 'model'){
                        lastMessage.content = responseText;
                    }
                    return newMessages;
                });
            }
        } catch (err: any) {
            handleShowError(err.message || "An error occurred in chat.");
            setChatMessages(prev => [...prev, { role: 'model', content: `<p class="text-red-400">Sorry, I encountered an error: ${err.message}</p>` }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="flex h-screen w-screen flex-col md:flex-row relative bg-background">
            <Sidebar
                isImageLoaded={isImageLoaded} isLoading={isLoading} canUndo={canUndo} prompt={prompt} setPrompt={setPrompt}
                isDraftMode={isDraftMode} setDraftMode={setDraftMode} brushSize={brushSize} setBrushSize={setBrushSize}
                onImageUpload={handleImageUpload} onGenerate={handleGenerate} onMagicEdit={handleMagicEdit}
                onUndo={undo} onDownload={handleDownload} onClearMask={() => setClearMaskSignal(s => s + 1)}
                onGenerateMultiView={handleGenerateMultiView} onToggleChat={() => setIsChatOpen(!isChatOpen)}
            />
            <ImageCanvas
                currentImage={currentImage} originalImage={originalImage} onMaskChange={setMaskDataUrl}
                brushSize={brushSize} onClearMask={clearMaskSignal} isMaskCanvasVisible={isImageLoaded}
            />
            <ChatPanel 
                isOpen={isChatOpen} isMaximized={isChatMaximized} messages={chatMessages} isThinking={isThinking}
                attachment={attachment} onAttachmentChange={handleAttachmentChange} onClose={() => setIsChatOpen(false)}
                onToggleSize={() => setIsChatMaximized(!isChatMaximized)} onNewChat={startNewChat}
                onSubmit={handleChatSubmit} onRunCode={setCodeToRun}
            />
            <LoadingOverlay isLoading={isLoading} loadingText={loadingText} />
            <ErrorToast message={error} onDismiss={() => setError("")} />
            {multiViewImages.length > 0 && <MultiViewModal images={multiViewImages} onClose={() => setMultiViewImages([])} />}
            {codeToRun && <CodeRunnerModal code={codeToRun} onClose={() => setCodeToRun(null)} />}
        </div>
    );
}
