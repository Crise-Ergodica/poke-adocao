import sys

def fix_file(filename, header):
    with open(filename, 'r') as f:
        lines = f.readlines()

    # Remove existing header if it looks like one
    if filename.endswith('.py'):
        while lines and (lines[0].startswith('"""') or 'Author' in lines[0] or lines[0].strip() == ''):
            lines.pop(0)
        lines.insert(0, header + '\n')
    elif filename.endswith('.tsx'):
        while lines and (lines[0].startswith('/*') or lines[0].startswith(' *') or lines[0].startswith(' */') or lines[0].strip() == ''):
            lines.pop(0)
        lines.insert(0, header + '\n')

    with open(filename, 'w') as f:
        f.writelines(lines)

py_header = '"""\nAuthor: Aurora Drumond Magalhães, Ana Clara de Souza e Kayke Wellington\n"""\n'
tsx_header = '/**\n * Author: Aurora Drumond Magalhães, Ana Clara de Souza e Kayke Wellington\n */\n'

fix_file('backend/app/main.py', py_header)
fix_file('backend/app/schemas.py', py_header)
fix_file('backend/app/models.py', py_header)
fix_file('src/screens/AdoptionBoardScreen.tsx', tsx_header)
