import React from 'react';

interface FaceProps {
  type: string;
  className?: string;
}

const Face: React.FC<FaceProps> = ({ type, className = "w-full h-full" }) => {
  const getFacePaths = () => {
    switch (type) {
      case 'great':
        return (
          <>
            {/* Surjer roshmi (Sun rays) */}
            <path d="M50 8 L50 15 M50 85 L50 92 M8 50 L15 50 M85 50 L92 50 M20 20 L25 25 M80 80 L75 75 M20 80 L25 75 M80 20 L75 25" stroke="#FCD34D" strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="50" r="32" fill="url(#gradGreat)" />
            {/* Chokh o Mukh */}
            <path d="M40 45 Q40 40 43 45" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
            <path d="M60 45 Q60 40 57 45" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
            <path d="M35 55 Q50 70 65 55 Z" fill="#78350F" />
            <path d="M45 60 Q50 65 55 60 Z" fill="#EF4444" /> {/* Jihba */}
          </>
        );
      case 'good':
        return (
          <>
            <circle cx="50" cy="50" r="38" fill="url(#gradGood)" />
            <circle cx="38" cy="42" r="4" fill="#064E3B" />
            <circle cx="62" cy="42" r="4" fill="#064E3B" />
            <path d="M35 58 Q50 70 65 58" stroke="#064E3B" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        );
      case 'okay':
        return (
          <>
            <circle cx="50" cy="50" r="38" fill="url(#gradOkay)" />
            <path d="M36 42 L40 42" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
            <path d="M60 42 L64 42" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
            <path d="M38 60 L62 60" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
          </>
        );
      case 'low':
        return (
          <>
            <circle cx="50" cy="50" r="38" fill="url(#gradLow)" />
            <path d="M35 45 Q38 40 41 45" stroke="#4C1D95" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M59 45 Q62 40 65 45" stroke="#4C1D95" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M40 62 Q50 55 60 62" stroke="#4C1D95" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        );
      case 'help':
        return (
          <>
            <circle cx="50" cy="50" r="38" fill="url(#gradHelp)" />
            {/* Vru (Eyebrows) */}
            <path d="M32 38 Q38 35 42 40" stroke="#7F1D1D" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M68 38 Q62 35 58 40" stroke="#7F1D1D" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="38" cy="46" r="3.5" fill="#7F1D1D" />
            <circle cx="62" cy="46" r="3.5" fill="#7F1D1D" />
            <path d="M40 65 Q50 55 60 65" stroke="#7F1D1D" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Kanna (Tear) */}
            <path d="M38 52 Q38 58 35 55" fill="#93C5FD" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 100 100" className={className}>
      <defs>
        <radialGradient id="gradGreat" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
        <radialGradient id="gradGood" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#22C55E" />
        </radialGradient>
        <radialGradient id="gradOkay" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#EAB308" />
        </radialGradient>
        <radialGradient id="gradLow" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#7E22CE" />
        </radialGradient>
        <radialGradient id="gradHelp" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="100%" stopColor="#EF4444" />
        </radialGradient>
      </defs>
      {getFacePaths()}
    </svg>
  );
};

export default Face;
