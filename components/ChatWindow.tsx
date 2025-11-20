import * as React from 'react';
import { ChatMessage, ChatSession } from '../types';
import Message from './Message';
import ChatInput from './ChatInput';
import LoadingIndicator from './LoadingIndicator';
import { AIIcon, LogInIcon } from './icons/Icons';

interface ChatWindowProps {
    session: ChatSession | null;
    onSendMessage: (userInput: string, file: File | null) => void;
    isLoading: boolean;
    isLoggedIn: boolean;
    onLogin: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ session, onSendMessage, isLoading, isLoggedIn, onLogin }) => {
  const [attachmentFile, setAttachmentFile] = React.useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = React.useState<{ url: string; type: 'image' } | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  const messages = session ? session.messages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
  React.useEffect(() => {
    return () => {
      if (attachmentPreview) {
        URL.revokeObjectURL(attachmentPreview.url);
      }
    };
  }, [attachmentPreview]);

  const handleFileSelect = (file: File) => {
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview.url);
    }
    setAttachmentFile(file);
    setAttachmentPreview({ url: URL.createObjectURL(file), type: 'image' });
  };

  const handleFileRemove = React.useCallback(() => {
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview.url);
    }
    setAttachmentFile(null);
    setAttachmentPreview(null);
  }, [attachmentPreview]);

  const handleSendMessageWrapper = React.useCallback(async (userInput: string) => {
    if ((!userInput.trim() && !attachmentFile) || isLoading) return;
    onSendMessage(userInput, attachmentFile);
    handleFileRemove();
  }, [isLoading, attachmentFile, onSendMessage, handleFileRemove]);
  
  const showWelcomeScreen = !isLoggedIn && !session;
  
  const WelcomeScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center -mt-16 px-4">
        <div className="w-20 h-20 mb-6 bg-gradient-to-br from-red-500 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
            <AIIcon className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-wide">
            <span className="text-red-600">bapkam</span>.ai
        </h1>
        <p className="mt-4 text-lg text-slate-500 max-w-md">Login to enjoy our chat and save your conversations.</p>
        <div className="mt-8">
            <button
                onClick={onLogin}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full font-semibold transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-red-500 shadow-lg"
            >
                <LogInIcon className="w-5 h-5" />
                <span>Login to Get Started</span>
            </button>
        </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
        {showWelcomeScreen ? (
          <WelcomeScreen />
        ) : (
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <Message key={`${session?.id}-${index}`} message={msg} />
            ))}
            {isLoading && <LoadingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <div className="relative p-4 md:p-6 bg-slate-50 border-t border-slate-200">
        <ChatInput 
          onSendMessage={handleSendMessageWrapper} 
          isLoading={isLoading}
          filePreview={attachmentPreview}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
        />
      </div>
    </div>
  );
};

export default ChatWindow;