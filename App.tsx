import * as React from 'react';
import ChatWindow from './components/ChatWindow';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Gallery from './components/Gallery';
import { ChatSession, ChatMessage, ChatMessageRole } from './types';
import { generateChatResponse, generateContentWithSearch, generateImage, generateContentWithFile } from './services/geminiService';

const App: React.FC = () => {
    const [sessions, setSessions] = React.useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = React.useState<string[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(window.innerWidth > 768);
    const [currentView, setCurrentView] = React.useState<'chat' | 'gallery'>('chat');
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [toastMessage, setToastMessage] = React.useState<string | null>(null);
    
    // Simple local auth state
    const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>(false);

    const activeSession = sessions.find(s => s.id === activeSessionId) || null;
    
    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Effect to clear session data when user logs out
    React.useEffect(() => {
        if (!isLoggedIn) {
            setActiveSessionId(null);
            setSessions([]);
            setGeneratedImages([]);
            setCurrentView('chat');
        }
    }, [isLoggedIn]);


    React.useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const showToast = (message: string) => {
        setToastMessage(message);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    const handleLogin = () => {
        setIsLoggedIn(true);
        showToast("Successfully logged in!");
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        showToast("Logged out.");
    };

    const handleNewChat = () => {
        if (!isLoggedIn) {
            handleLogin();
            return;
        }
        setActiveSessionId(null);
        setCurrentView('chat');
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
        }
    };
    
    const handleSelectSession = (id: string) => {
        setActiveSessionId(id);
        setCurrentView('chat');
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
        }
    };

    const handleShowGallery = () => {
         if (!isLoggedIn) {
            handleLogin();
            return;
        }
        setCurrentView('gallery');
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
        }
    };
    
    const handleSendMessage = React.useCallback(async (userInput: string, file: File | null) => {
        if (isLoading) return;

        let currentSessionId = activeSessionId;
        
        if (!currentSessionId) {
            currentSessionId = Date.now().toString();
            setActiveSessionId(currentSessionId);
            const newSession: ChatSession = {
                id: currentSessionId,
                title: userInput.trim().substring(0, 40) || (file ? 'Image Chat' : 'New Chat'),
                messages: [],
            };
            setSessions(prev => [newSession, ...prev]);
        }
        
        const attachmentPreview: ChatMessage['attachment'] = file ? { url: URL.createObjectURL(file), type: 'image' } : undefined;

        const userMessage: ChatMessage = {
            role: ChatMessageRole.USER,
            content: userInput,
            attachment: attachmentPreview,
        };

        setSessions(prev => prev.map(s =>
            s.id === currentSessionId ? { ...s, messages: [...s.messages, userMessage] } : s
        ));
        
        setIsLoading(true);

        try {
            let modelResponse: Omit<ChatMessage, 'role'>;
            const history = sessions.find(s => s.id === currentSessionId)?.messages || [];

            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const foundUrls = userInput.match(urlRegex);
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})/;
            const isYouTubeLink = youtubeRegex.test(userInput);

            if (file) {
                const result = await generateContentWithFile(userInput, file);
                modelResponse = { content: result.text };
            } else if (userInput.startsWith('/search ')) {
                const query = userInput.substring(8);
                const result = await generateContentWithSearch(query);
                modelResponse = { content: result.text, sources: result.sources };
            } else if (userInput.startsWith('/imagine ')) {
                const prompt = userInput.substring(9);
                const imageUrl = await generateImage(prompt);
                modelResponse = { content: imageUrl };
                setGeneratedImages(prev => [imageUrl, ...prev]);
            } else if (isYouTubeLink || foundUrls) {
                const result = await generateContentWithSearch(userInput);
                modelResponse = { content: result.text, sources: result.sources };
            } else {
                const result = await generateChatResponse(userInput, history);
                modelResponse = { content: result.text, modelSources: result.modelSources };
            }

            const finalModelMessage: ChatMessage = {
                role: ChatMessageRole.MODEL,
                ...modelResponse,
            };

            setSessions(prev => prev.map(s =>
                s.id === currentSessionId ? { ...s, messages: [...s.messages, finalModelMessage] } : s
            ));

        } catch (error) {
            const errorMessage: ChatMessage = {
                role: ChatMessageRole.MODEL,
                content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
            };
            setSessions(prev => prev.map(s =>
                s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMessage] } : s
            ));
        } finally {
            setIsLoading(false);
            if (attachmentPreview) {
                URL.revokeObjectURL(attachmentPreview.url);
            }
        }
    }, [isLoading, activeSessionId, sessions]);
    
    const handleSendMessageTrigger = (userInput: string, file: File | null) => {
        if (!isLoggedIn) {
            handleLogin();
        } else {
            handleSendMessage(userInput, file);
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-slate-50 text-slate-900 font-sans antialiased">
            <Header 
                toggleSidebar={toggleSidebar}
                showToast={showToast}
                isLoggedIn={isLoggedIn}
                onLogin={handleLogin}
                onLogout={handleLogout}
            />
            <div className="flex-1 flex overflow-hidden">
                <Sidebar 
                    sessions={sessions} 
                    activeSessionId={activeSessionId}
                    onNewChat={handleNewChat}
                    onSelectSession={handleSelectSession}
                    onShowGallery={handleShowGallery}
                    isSidebarOpen={isSidebarOpen}
                    currentView={currentView}
                    isLoggedIn={isLoggedIn}
                />
                <main className="flex-1 overflow-hidden relative">
                    {isSidebarOpen && <div onClick={toggleSidebar} className="absolute inset-0 bg-black/30 z-10 md:hidden" aria-hidden="true"></div>}
                    
                    {currentView === 'chat' ? (
                        <ChatWindow 
                            session={activeSession}
                            onSendMessage={handleSendMessageTrigger}
                            isLoading={isLoading}
                            isLoggedIn={isLoggedIn}
                            onLogin={handleLogin}
                        />
                    ) : (
                        <Gallery 
                            images={generatedImages} 
                            isLoggedIn={isLoggedIn}
                            onLogin={handleLogin}
                        />
                    )}
                </main>
            </div>
            {toastMessage && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-lg z-50 text-sm font-medium animate-fade-in-up">
                <p>{toastMessage}</p>
                </div>
            )}

            <style>{`
                @keyframes fade-in-up {
                from { opacity: 0; transform: translate(-50%, 10px); }
                to { opacity: 1; transform: translate(-50%, 0); }
                }
                .animate-fade-in-up {
                animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default App;