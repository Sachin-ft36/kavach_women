import os

file_path = r'c:\Users\hp\Desktop\india gov project\kavach_women\src\components\SuperCellDashboard.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the double </main> tags
new_lines = []
skip_next = False
for i in range(len(lines)):
    if skip_next:
        skip_next = False
        continue
    if i < len(lines) - 1 and '</main>' in lines[i].strip() and '</main>' in lines[i+1].strip():
        new_lines.append(lines[i])
        skip_next = True
        continue
    new_lines.append(lines[i])

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
