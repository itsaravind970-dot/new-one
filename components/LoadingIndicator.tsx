import * as React from 'react';
import { AIIcon } from './icons/Icons';

interface LoadingIndicatorProps {}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = () => {
  const loadingText = 'Bapkam is working...';

  return (
    <div className="flex items-start gap-3">
       <div className="w-8 h-8 flex-shrink-0 bg-slate-200 rounded-full flex items-center justify-center">
          <AIIcon className="w-5 h-5 text-slate-600" />
        </div>
      <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 rounded-bl-none">
        <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{loadingText}</span>
            <div className="flex items-center justify-center space-x-1">
            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
