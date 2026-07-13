const fs = require('fs');
const file = 'c:\\\\Users\\\\hp\\\\Desktop\\\\india gov project\\\\kavach_women\\\\src\\\\screens\\\\TalkToSomeoneScreen.tsx';
let content = fs.readFileSync(file, 'utf8');
let lines = content.split('\n');

const insertIndex = lines.findIndex(l => l.includes('import { SafeSpaceOptions }'));
if (insertIndex !== -1) {
    lines.splice(insertIndex + 1, 0, 'import { TalkToTrustedNetwork } from "../features/mood-checkin/TalkToTrustedNetwork";');
}

const optionsIndex = lines.findIndex(l => l.includes('// Render Welcome Options Page (Step 2)'));
const endIndex = lines.findIndex(l => l.includes('// Render original directory/chat interface if welcome page is dismissed'));

if (optionsIndex !== -1 && endIndex !== -1) {
    const replacement = `  // Render Welcome Options Page (Step 2)
  if (showWelcome && welcomeStep === 2) {
    return (
      <SafeSpaceOptions 
        onBack={() => setWelcomeStep(1)}
        onTalkToSomeone={() => setWelcomeStep(3)}
        onCalmDown={() => setActiveTab('calm_space')}
        onStartAIChat={startAIChat}
        onStartJournalChat={startJournalChat}
      />
    );
  }

  // Render Talk to Trusted Network (Step 3)
  if (showWelcome && welcomeStep === 3) {
    return (
      <TalkToTrustedNetwork 
        onBack={() => setWelcomeStep(2)}
        onSend={(contactId, method, message) => {
          console.log('Sending to', contactId, 'via', method, ':', message);
          // For now, after sending, we return to the dashboard
          setActiveTab('dashboard');
        }}
      />
    );
  }
`;
    lines.splice(optionsIndex, endIndex - optionsIndex, replacement);
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log('Successfully added TalkToTrustedNetwork to TalkToSomeoneScreen.tsx');
} else {
    console.error('Could not find the target lines');
}
