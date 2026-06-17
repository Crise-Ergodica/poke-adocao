def fix_file(filename, original_text):
    with open(filename, 'r') as f:
        lines = f.readlines()
    if filename.endswith('models.py') and lines[3].startswith('Database models'):
        lines[3] = '"""\n' + lines[3] + '"""\n'
    if filename.endswith('schemas.py') and lines[3].startswith('Pydantic schemas'):
        lines[3] = '"""\n' + lines[3] + '"""\n'
    with open(filename, 'w') as f:
        f.writelines(lines)

fix_file('backend/app/models.py', '')
fix_file('backend/app/schemas.py', '')
