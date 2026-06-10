const fs = require('fs');
const path = require('path');

const dir = path.join('c:', 'Users', 'hp', 'Desktop', 'india gov project', 'kavach_women', 'src', 'components', 'onboarding');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace font-black with font-semibold
  content = content.replace(/font-black/g, 'font-semibold');
  
  // Replace text-[10px] uppercase tracking-widest with text-xs font-medium text-gray-500
  // Note: we just replace the utility classes globally
  content = content.replace(/text-\[10px\]\s+(?:font-semibold|font-black)\s+text-gray-400\s+uppercase\s+tracking-widest/g, 'text-xs font-medium text-gray-500');
  
  content = content.replace(/text-\[10px\]/g, 'text-xs');
  content = content.replace(/text-\[9px\]/g, 'text-xs');
  content = content.replace(/text-\[8px\]/g, 'text-[10px]');
  
  // Remove uppercase and tracking classes where they make things aggressive
  content = content.replace(/\buppercase\b/g, '');
  content = content.replace(/\btracking-widest\b/g, '');
  content = content.replace(/\btracking-tight\b/g, '');
  content = content.replace(/\btracking-wider\b/g, '');

  // Inputs are currently font-bold, let's make them font-medium
  content = content.replace(/text-sm\s+font-bold/g, 'text-sm font-medium');

  // Clean up double spaces caused by removing words
  content = content.replace(/  +/g, ' ');
  // Clean up space before closing quote
  content = content.replace(/ \)/g, ')');
  content = content.replace(/ "/g, '"');
  content = content.replace(/ '/g, "'");
  content = content.replace(/ }/g, '}');

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Replaced classes for a calmer look in all steps.');
