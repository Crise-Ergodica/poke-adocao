import sys

def fix_syntax(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # We messed up the docstrings. Let's restore them properly.
    if filename.endswith('.py'):
        with open(filename, 'w') as f:
            f.write('"""\nAuthor: Aurora Drumond Magalhães, Ana Clara de Souza e Kayke Wellington\n"""\n' + content.split('Author: Aurora Drumond Magalhães, Ana Clara de Souza e Kayke Wellington\n')[-1].lstrip('\n'))

fix_syntax('backend/app/main.py')
fix_syntax('backend/app/schemas.py')
fix_syntax('backend/app/models.py')
