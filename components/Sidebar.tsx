import * as React from 'react';
import { ChatSession } from '../types';
import { NewChatIcon, GalleryIcon, ChatIcon } from './icons/Icons';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onShowGallery: () => void;
  isSidebarOpen: boolean;
  currentView: 'chat' | 'gallery';
  isLoggedIn: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onShowGallery,
  isSidebarOpen,
  currentView,
  isLoggedIn,
}) => {
  return (
    <aside
      className={`absolute md:relative flex-shrink-0 w-64 bg-slate-800 text-slate-200 flex flex-col transition-transform duration-300 ease-in-out z-20 h-full ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}
      aria-hidden={!isSidebarOpen}
    >
      <div className="p-4 border-b border-slate-700">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500"
        >
          <NewChatIcon className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h3 className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversations</h3>
          <ul className="space-y-1">
            {isLoggedIn && sessions.map(session => (
              <li key={session.id}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectSession(session.id);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSessionId === session.id && currentView === 'chat'
                      ? 'bg-red-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <ChatIcon className="w-4 h-4" />
                  <span className="truncate flex-1">{session.title}</span>
                </a>
              </li>
            ))}
            {(!isLoggedIn || sessions.length === 0) && (
                <li className="px-3 py-2 text-sm text-slate-400">
                  {isLoggedIn ? 'No recent chats.' : 'Please log in to see your chats.'}
                </li>
            )}
          </ul>
        </div>
        <div>
           <h3 className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Library</h3>
           <ul className="space-y-1">
             <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onShowGallery();
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'gallery' && isLoggedIn
                      ? 'bg-red-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <GalleryIcon className="w-4 h-4" />
                  <span>Image Library</span>
                </a>
              </li>
           </ul>
        </div>
      </nav>
      <div className="p-4 border-t border-slate-700 text-center">
        <p className="text-xs text-slate-500">
          Powered by Gemini
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
