import os
import re

def fix_app_imports():
    app_tsx_path = 'src/app/App.tsx'
    try:
        with open(app_tsx_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace ./folder with ../folder in App.tsx
        for folder in ['components', 'lib', 'services', 'state', 'hooks', 'screens']:
            content = re.sub(fr'([\'"])\./{folder}/', fr'\1../{folder}/', content)
        
        with open(app_tsx_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fixed App.tsx imports")
    except Exception as e:
        print(f"Error processing App.tsx: {e}")

def fix_main_imports():
    main_tsx_path = 'src/app/main.tsx'
    try:
        with open(main_tsx_path, 'r', encoding='utf-8') as f:
            content = f.read()

        content = content.replace("'./index.css'", "'../index.css'")
        content = content.replace("'./contexts/", "'../contexts/")
        
        with open(main_tsx_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fixed main.tsx imports")
    except Exception as e:
        print(f"Error processing main.tsx: {e}")

def fix_core_to_engine():
    # Globally replace ../core/ with ../engine/ (or similar) in TS/TSX files
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if '../core/' in content:
                        new_content = content.replace('../core/', '../engine/')
                        # might need ../../core/ -> ../../engine/
                        new_content = new_content.replace('../../core/', '../../engine/')
                        
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Fixed core->engine in {filepath}")
                except Exception as e:
                    pass

def fix_domain_types():
    # Globally replace references to domain/types or domain/Incident
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # types.ts moved to src/state/slices/types.ts
                    # domain/Incident moved? let's see. Wait, I'll just change domain/types to state/slices/types
                    if '/domain/types' in content:
                        new_content = re.sub(r'([\'"])([.]{1,3})/domain/types([\'"])', lambda m: m.group(0).replace('/domain/types', '/state/slices/types'), content)
                        if new_content != content:
                            with open(filepath, 'w', encoding='utf-8') as f:
                                f.write(new_content)
                            print(f"Fixed domain/types in {filepath}")
                except Exception as e:
                    pass

if __name__ == '__main__':
    fix_app_imports()
    fix_main_imports()
    fix_core_to_engine()
    fix_domain_types()
