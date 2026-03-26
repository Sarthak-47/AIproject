import zipfile
import xml.etree.ElementTree as ET
import sys

def read_docx(path):
    with zipfile.ZipFile(path) as docx:
        tree = ET.fromstring(docx.read('word/document.xml'))
    
    namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    paragraphs = []
    
    for paragraph in tree.findall('.//w:p', namespaces):
        texts = [node.text for node in paragraph.findall('.//w:t', namespaces) if node.text]
        if texts:
            paragraphs.append("".join(texts))
            
    return "\n".join(paragraphs)

if __name__ == '__main__':
    text = read_docx(sys.argv[1])
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        f.write(text)
    print("Done")
