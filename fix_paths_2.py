import os
import re

def fix_domain_types_regex():
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if '/domain/types' in content:
                        new_content = re.sub(r'([\'"])([.a-zA-Z0-9/]+)/domain/types([\'"])', lambda m: m.group(0).replace('/domain/types', '/state/slices/types'), content)
                        
                        if new_content != content:
                            with open(filepath, 'w', encoding='utf-8') as f:
                                f.write(new_content)
                            print(f"Fixed domain/types in {filepath}")
                except Exception as e:
                    pass

if __name__ == '__main__':
    fix_domain_types_regex()
