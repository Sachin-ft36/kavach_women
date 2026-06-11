import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ShieldCheck, CheckCircle2, MessageSquare, User } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface ProtectorRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  alertId: string;
  responders: string[];
}

export default function ProtectorRatingModal({ isOpen, onClose, alertId, responders }: ProtectorRatingModalProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [protectorProfiles, setProtectorProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    if (isOpen && responders && responders.length > 0) {
      const fetchProtectors = async () => {
        try {
          const profiles = [];
          for (const pid of responders) {
            const snap = await getDoc(doc(db, 'users', pid));
            if (snap.exists()) {
              profiles.push({ id: snap.id, ...snap.data() });
            }
          }
          setProtectorProfiles(profiles);
        } catch (error) {
          console.error("Error fetching protectors:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProtectors();
    }
  }, [isOpen, responders]);

  const handleRatingChange = (uid: string, rating: number) => {
    setRatings(prev => ({ ...prev, [uid]: rating }));
  };

  const handleFeedbackChange = (uid: string, text: string) => {
    setFeedbacks(prev => ({ ...prev, [uid]: text }));
  };

  const handleSubmit = async () => {
    if (Object.keys(ratings).length === 0) {
      toast.error('Please rate at least one protector.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update each rated protector's stats
      for (const [uid, rating] of Object.entries(ratings)) {
        const protectorRef = doc(db, 'users', uid);
        const pSnap = await getDoc(protectorRef);
        
        if (pSnap.exists()) {
          const data = pSnap.data();
          const currentRating = data.stats?.rating || data.rating || 0;
          const currentCount = data.stats?.ratingCount || data.ratingCount || 0;
          
          const newCount = currentCount + 1;
          // Calculate new moving average
          const newRating = ((currentRating * currentCount) + rating) / newCount;

          await updateDoc(protectorRef, {
            'stats.rating': parseFloat(newRating.toFixed(1)),
            'stats.ratingCount': newCount,
            'rating': parseFloat(newRating.toFixed(1)), // For legacy support
            'ratingCount': newCount // For legacy support
          });
        }
      }

      // 2. Mark alert as rated
      await updateDoc(doc(db, 'alerts', alertId), {
        isRated: true,
        ratingsProvided: ratings,
        feedbacksProvided: feedbacks
      });

      toast.success('Thank you for your feedback!');
      onClose();
    } catch (error) {
      console.error('Error submitting ratings:', error);
      toast.error('Failed to submit ratings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl pointer-events-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <ShieldCheck size={100} />
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/30 relative z-10">
                  <CheckCircle2 size={28} className="text-white" />
                </div>
                <h2 className="text-xl font-black text-white relative z-10">Mission Accomplished</h2>
                <p className="text-blue-100 text-sm mt-1 relative z-10">Rate the protectors who assisted you</p>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6 bg-gray-50">
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : protectorProfiles.length > 0 ? (
                  protectorProfiles.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl p-4 border shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center border-2 border-gray-100 shrink-0">
                          {p.displayPhotoUrl || p.photoUrl || p.photoURL ? (
                            <img src={p.displayPhotoUrl || p.photoUrl || p.photoURL} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User size={24} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 leading-tight">{p.displayName || p.name || 'Protector'}</h3>
                          <p className="text-xs text-blue-600 font-medium">Verified Responder</p>
                        </div>
                      </div>

                      <div className="flex justify-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => handleRatingChange(p.id, star)}
                            className={`p-1.5 transition-all ${
                              (ratings[p.id] || 0) >= star ? 'text-amber-400 scale-110' : 'text-gray-200 hover:text-amber-200'
                            }`}
                          >
                            <Star size={28} fill="currentColor" />
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <MessageSquare size={14} className="absolute left-3 top-3 text-gray-400" />
                        <textarea
                          placeholder="Optional feedback..."
                          value={feedbacks[p.id] || ''}
                          onChange={(e) => handleFeedbackChange(p.id, e.target.value)}
                          className="w-full bg-gray-50 border-none rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 resize-none h-20"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No responder data found.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-white border-t">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || Object.keys(ratings).length === 0}
                  className="w-full bg-gray-900 text-white rounded-xl py-3.5 font-bold disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Ratings'}
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-center py-3 text-sm font-bold text-gray-400 mt-1"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
