import os
import re

def fix_imports(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Replace variations of /store/useKavachStore
                    content = re.sub(r'([\'"])([.]{1,2}/)+store/useKavachStore([\'"])', lambda m: m.group(0).replace('/store/', '/state/'), content)
                    content = re.sub(r'([\'"])([.]{1,2}/)+stores/protectionStore([\'"])', lambda m: m.group(0).replace('/stores/', '/state/'), content)
                    content = re.sub(r'([\'"])([.]{1,2}/)+stores/uiStore([\'"])', lambda m: m.group(0).replace('/stores/', '/state/'), content)
                    content = re.sub(r'([\'"])([.]{1,2}/)+stores/useSupercellStore([\'"])', lambda m: m.group(0).replace('/stores/', '/state/'), content)
                    
                    # Also domain types
                    # The error was: Cannot find module '../../../domain/types' or its corresponding type declarations.
                    # Wait, where did domain go? Let's fix state first.

                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

if __name__ == '__main__':
    fix_imports('src')
    print("State imports fixed.")
