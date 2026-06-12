import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export function VettingPhotoZoomModal({ isOpen, onClose, user: u }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative"
          >
            <img
              src={u.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name || u.username}`}
              alt="Enlarged Profile Pic"
              className="max-w-full max-h-[80vh] object-contain"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <p className="text-lg font-black uppercase tracking-tight text-white">{u.name || u.username || 'Anonymous User'}</p>
              <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">{u.role}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
