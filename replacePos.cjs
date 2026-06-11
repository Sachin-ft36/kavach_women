const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('c:/Users/hp/Desktop/india gov project/kavach_women/src');
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content;
    
    // Replace userPos[0] with userPos?.lat
    // Need to handle optional chaining just in case some files have userPos?.[0]
    newContent = newContent.replace(/userPos\?\.\[0\]/g, 'userPos?.lat');
    newContent = newContent.replace(/userPos\?\.\[1\]/g, 'userPos?.lng');
    newContent = newContent.replace(/userPos\[0\]/g, 'userPos.lat');
    newContent = newContent.replace(/userPos\[1\]/g, 'userPos.lng');
    
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        changedCount++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Successfully updated ${changedCount} files.`);
