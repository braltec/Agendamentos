#!/usr/bin/env python3
"""
Conversor de Markdown para HTML estilizado
Compatível com Google Docs
"""

import re
import sys

def markdown_to_html(md_content):
    """Converte Markdown para HTML com estilos"""
    
    html = md_content
    
    # Cabeçalhos
    html = re.sub(r'^# (.+)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^#### (.+)$', r'<h4>\1</h4>', html, flags=re.MULTILINE)
    
    # Negrito e itálico
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)
    
    # Código inline
    html = re.sub(r'`([^`]+)`', r'<code>\1</code>', html)
    
    # Links
    html = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'<a href="\2">\1</a>', html)
    
    # Listas não ordenadas
    html = re.sub(r'^\- (.+)$', r'<li>\1</li>', html, flags=re.MULTILINE)
    html = re.sub(r'((?:<li>.*</li>\n?)+)', r'<ul>\1</ul>', html)
    
    # Listas ordenadas
    html = re.sub(r'^\d+\. (.+)$', r'<li>\1</li>', html, flags=re.MULTILINE)
    
    # Blocos de código
    code_blocks = re.finditer(r'```(\w+)?\n(.*?)```', html, re.DOTALL)
    for match in reversed(list(code_blocks)):
        lang = match.group(1) or ''
        code = match.group(2)
        replacement = f'<pre><code class="language-{lang}">{code}</code></pre>'
        html = html[:match.start()] + replacement + html[match.end():]
    
    # Tabelas (básico)
    html = re.sub(r'^\|(.+)\|$', lambda m: '<tr>' + ''.join(f'<td>{cell.strip()}</td>' for cell in m.group(1).split('|')) + '</tr>', html, flags=re.MULTILINE)
    html = re.sub(r'((?:<tr>.*</tr>\n?)+)', r'<table border="1" cellpadding="5" cellspacing="0">\1</table>', html)
    
    # Parágrafos
    lines = html.split('\n')
    result = []
    in_block = False
    
    for line in lines:
        stripped = line.strip()
        
        # Verifica se está em um bloco especial
        if stripped.startswith(('<h', '<ul', '<ol', '<pre', '<table', '<li', '</ul', '</ol', '</table', '<tr', '<td')):
            in_block = True
            result.append(line)
        elif stripped.startswith(('</h', '</pre')):
            result.append(line)
            in_block = False
        elif stripped == '':
            if not in_block:
                result.append('<br>')
            else:
                result.append(line)
        elif not in_block and not stripped.startswith('<'):
            result.append(f'<p>{line}</p>')
        else:
            result.append(line)
    
    html = '\n'.join(result)
    
    return html

def create_html_document(content):
    """Cria documento HTML completo com estilos"""
    
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentação do Banco de Dados - Sistema de Agendamento</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background-color: #fff;
        }}
        
        h1 {{
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-top: 30px;
            font-size: 2.5em;
        }}
        
        h2 {{
            color: #34495e;
            border-bottom: 2px solid #95a5a6;
            padding-bottom: 8px;
            margin-top: 25px;
            font-size: 2em;
        }}
        
        h3 {{
            color: #2980b9;
            margin-top: 20px;
            font-size: 1.5em;
        }}
        
        h4 {{
            color: #16a085;
            margin-top: 15px;
            font-size: 1.2em;
        }}
        
        code {{
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #e74c3c;
            font-size: 0.9em;
        }}
        
        pre {{
            background-color: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #3498db;
        }}
        
        pre code {{
            background-color: transparent;
            color: #ecf0f1;
            padding: 0;
        }}
        
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        
        th, td {{
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }}
        
        th {{
            background-color: #3498db;
            color: white;
            font-weight: bold;
        }}
        
        tr:nth-child(even) {{
            background-color: #f9f9f9;
        }}
        
        tr:hover {{
            background-color: #f5f5f5;
        }}
        
        ul, ol {{
            margin: 10px 0;
            padding-left: 30px;
        }}
        
        li {{
            margin: 5px 0;
        }}
        
        strong {{
            color: #2c3e50;
            font-weight: 600;
        }}
        
        em {{
            color: #7f8c8d;
        }}
        
        a {{
            color: #3498db;
            text-decoration: none;
        }}
        
        a:hover {{
            text-decoration: underline;
        }}
        
        blockquote {{
            border-left: 4px solid #3498db;
            padding-left: 15px;
            margin: 20px 0;
            color: #7f8c8d;
            font-style: italic;
        }}
        
        hr {{
            border: none;
            border-top: 2px solid #ecf0f1;
            margin: 30px 0;
        }}
        
        .emoji {{
            font-size: 1.2em;
        }}
        
        @media print {{
            body {{
                max-width: 100%;
            }}
            pre {{
                page-break-inside: avoid;
            }}
        }}
    </style>
</head>
<body>
{content}
</body>
</html>"""

def main():
    # Ler arquivo Markdown
    input_file = 'DOCUMENTACAO_BANCO_DADOS.md'
    output_file = 'DOCUMENTACAO_BANCO_DADOS.html'
    
    print(f"📖 Lendo arquivo: {input_file}")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            md_content = f.read()
    except FileNotFoundError:
        print(f"❌ Erro: Arquivo {input_file} não encontrado!")
        sys.exit(1)
    
    print("🔄 Convertendo Markdown para HTML...")
    html_content = markdown_to_html(md_content)
    
    print("🎨 Aplicando estilos...")
    full_html = create_html_document(html_content)
    
    print(f"💾 Salvando arquivo: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(full_html)
    
    print(f"✅ Conversão concluída com sucesso!")
    print(f"\n📄 Arquivo gerado: {output_file}")
    print(f"\n💡 Como usar:")
    print(f"   1. Abra o arquivo {output_file} no navegador")
    print(f"   2. Pressione Ctrl+A (selecionar tudo)")
    print(f"   3. Pressione Ctrl+C (copiar)")
    print(f"   4. Abra o Google Docs")
    print(f"   5. Pressione Ctrl+V (colar)")
    print(f"   6. Salve como .docx no Google Drive")

if __name__ == '__main__':
    main()




