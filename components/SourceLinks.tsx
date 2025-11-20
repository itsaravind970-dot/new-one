import * as React from 'react';
import { GroundingSource } from '../types';
import { LinkIcon } from './icons/Icons';

interface SourceLinksProps {
  sources: GroundingSource[];
}

const SourceLinks: React.FC<SourceLinksProps> = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 pl-1 max-w-sm md:max-w-md lg:max-w-lg">
      <h4 className="text-xs font-semibold text-slate-500 mb-1">Sources:</h4>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-md transition-colors"
          >
            <LinkIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{source.title || new URL(source.uri).hostname}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default SourceLinks;
