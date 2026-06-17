with open('backend/app/main.py', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith('Main FastAPI application'):
        lines[i] = '"""\n' + line + '"""\n'
        break

with open('backend/app/main.py', 'w') as f:
    f.writelines(lines)
