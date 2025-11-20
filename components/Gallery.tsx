import * as React from 'react';
import { LogInIcon } from './icons/Icons';

interface GalleryProps {
  images: string[];
  isLoggedIn: boolean;
  onLogin: () => void;
}

const Gallery: React.FC<GalleryProps> = ({ images, isLoggedIn, onLogin }) => {
  if (!isLoggedIn) {
    return (
       <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-100">
            <div className="w-24 h-24 mb-6 bg-slate-200 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800">
                Your Image Library
            </h1>
            <p className="mt-2 text-slate-500 max-w-md">
                Please log in to view your gallery of generated images.
            </p>
            <div className="mt-8">
                <button
                    onClick={onLogin}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full font-semibold transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 focus:ring-red-500 shadow-lg"
                >
                    <LogInIcon className="w-5 h-5" />
                    <span>Login to View Gallery</span>
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Image Library</h1>
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-slate-300 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-400 mb-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <h2 className="text-xl font-semibold text-slate-600">No Images Generated Yet</h2>
            <p className="text-slate-500 mt-2">Use the <code className="bg-slate-200 text-slate-700 px-1 py-0.5 rounded-sm font-mono text-sm">/imagine</code> command in a chat to create some!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((imgSrc, index) => (
              <div key={index} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-200 shadow-md transition-shadow hover:shadow-xl">
                <img
                  src={imgSrc}
                  alt={`Generated image ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;