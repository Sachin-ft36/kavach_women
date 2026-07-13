const fs = require('fs');
const file = 'c:\\\\Users\\\\hp\\\\Desktop\\\\india gov project\\\\kavach_women\\\\src\\\\screens\\\\TalkToSomeoneScreen.tsx';
let content = fs.readFileSync(file, 'utf8');
let lines = content.split('\n');

const insertIndex = lines.findIndex(l => l.includes('import { useKavachStore }'));
lines.splice(insertIndex, 0, 'import { SafeSpaceWelcome } from "../features/mood-checkin/SafeSpaceWelcome";', 'import { SafeSpaceOptions } from "../features/mood-checkin/SafeSpaceOptions";');

const startIndex = lines.findIndex(l => l.includes('// Render Welcome Page Design'));
const endIndex = lines.findIndex(l => l.includes('// Render original directory/chat interface if welcome page is dismissed'));

const replacement = `  // Render Welcome Page Design
  if (showWelcome && welcomeStep === 1) {
    return (
      <SafeSpaceWelcome 
        onBack={() => setActiveTab('dashboard')}
        onContinue={() => setWelcomeStep(2)}
      />
    );
  }

  // Render Welcome Options Page (Step 2)
  if (showWelcome && welcomeStep === 2) {
    return (
      <SafeSpaceOptions 
        onBack={() => setWelcomeStep(1)}
        onTalkToSomeone={() => setShowWelcome(false)}
        onCalmDown={() => setActiveTab('calm_space')}
        onStartAIChat={startAIChat}
        onStartJournalChat={startJournalChat}
      />
    );
  }
`;

lines.splice(startIndex, endIndex - startIndex, replacement);
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Successfully updated TalkToSomeoneScreen.tsx');
