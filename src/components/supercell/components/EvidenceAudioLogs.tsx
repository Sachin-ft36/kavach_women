import React, { useState } from 'react';
import { Mic } from 'lucide-react';

export function EvidenceAudioLogs({ audioLogs, blobUrls }: any) {
  const [activeAudioIndex, setActiveAudioIndex] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-6 bg-purple-500 rounded-xl" />
        <h3 className="text-[14px] font-black text-white uppercase tracking-[4px]">Acoustic Logs</h3>
      </div>

      {audioLogs.length === 0 ? (
        <p className="text-[12px] font-bold text-gray-600 uppercase tracking-widest ">No audio logs available.</p>
      ) : (
        <div className="bg-purple-500/5 rounded-xl p-6 border border-purple-500/10 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
              <Mic size={24} className="text-purple-400" />
            </div>
            <div>
              <p className="text-[14px] font-black text-white uppercase ">Continuous Acoustic Stream</p>
              <p className="text-[11px] font-bold text-purple-400 uppercase tracking-widest mt-1">
                {audioLogs.length} Encrypted Segments • Auto-stitched
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            {(() => {
              const item = audioLogs[activeAudioIndex];
              if (!item) return null;
              const blobSrc = blobUrls[item.vaultId] || item.url;
              const hasSrc = !!blobSrc;

              return (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-purple-400/70 uppercase tracking-widest">
                      Playing Segment {activeAudioIndex + 1} of {audioLogs.length}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleTimeString() : 'SYNC...'}
                    </span>
                  </div>
                  {hasSrc ? (
                    <audio 
                      key={activeAudioIndex} 
                      autoPlay={activeAudioIndex > 0} 
                      controls 
                      className="w-full h-10"
                      onEnded={() => {
                        if (activeAudioIndex < audioLogs.length - 1) {
                          setActiveAudioIndex(prev => prev + 1);
                        } else {
                          setActiveAudioIndex(0);
                        }
                      }}
                    >
                      <source src={blobSrc} type={item.mimeType || 'audio/webm'} />
                    </audio>
                  ) : (
                    <div className="py-3 px-4 bg-purple-500/10 rounded-xl border border-purple-500/20 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-xl bg-purple-400 animate-ping" />
                      <span className="text-[10px] font-black text-purple-400/80 uppercase tracking-widest animate-pulse">Loading Buffer...</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
