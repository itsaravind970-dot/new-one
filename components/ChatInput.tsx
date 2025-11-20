import * as React from 'react';
import { SendIcon, CloseIcon, ThreeDotsVerticalIcon, PaperclipIcon, ImageIcon } from './icons/Icons';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  filePreview: { url: string; type: 'image' } | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, filePreview, onFileSelect, onFileRemove }) => {
  const [input, setInput] = React.useState('');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuToggle = () => {
    setIsMenuOpen(prev => !prev);
  };
  
  const handleAttachClick = () => {
    fileInputRef.current?.click();
    setIsMenuOpen(false);
  };

  const handleGenerateImageClick = () => {
    setInput('/imagine ');
    textareaRef.current?.focus();
    setIsMenuOpen(false);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || filePreview) && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const placeholderText = input.startsWith('/imagine ') 
    ? "Describe the image you want to create..."
    : "Message Bapkam...";

  return (
    <div className="relative">
        {filePreview && (
            <div className="absolute bottom-full left-0 mb-3 p-2 bg-white border border-slate-200 rounded-lg shadow-lg">
                <div className="relative">
                    <img src={filePreview.url} alt="Preview" className="max-h-32 rounded-md" />
                    <button
                        onClick={onFileRemove}
                        className="absolute -top-2 -right-2 bg-slate-200 text-slate-700 rounded-full p-0.5 hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label="Remove file"
                    >
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center space-x-3 bg-white border border-slate-300 rounded-full p-2 focus-within:ring-2 focus-within:ring-red-500 transition-shadow duration-200">
            <div className="relative">
                <button
                    type="button"
                    ref={menuButtonRef}
                    onClick={handleMenuToggle}
                    disabled={isLoading}
                    className="text-slate-500 rounded-full p-2 flex items-center justify-center hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-red-500"
                    aria-label="More options"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                >
                    <ThreeDotsVerticalIcon className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                    <div ref={menuRef} className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-10 py-1">
                        <button type="button" onClick={handleAttachClick} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            <PaperclipIcon className="w-4 h-4" />
                            <span>Upload File</span>
                        </button>
                        <button type="button" onClick={handleGenerateImageClick} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            <ImageIcon className="w-4 h-4" />
                            <span>Generate Image</span>
                        </button>
                    </div>
                )}
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                hidden 
            />
            <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholderText}
                className="flex-1 bg-transparent pr-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none resize-none"
                rows={1}
                disabled={isLoading}
                aria-label="Chat input"
            />
            <button
                type="submit"
                disabled={isLoading || (!input.trim() && !filePreview)}
                className="bg-red-600 text-white rounded-full p-3 flex items-center justify-center hover:bg-red-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-red-500"
                aria-label="Send message"
            >
                <SendIcon className="w-5 h-5" />
            </button>
        </form>
    </div>
  );
};

export default ChatInput;
