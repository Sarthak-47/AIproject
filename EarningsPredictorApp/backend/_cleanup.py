content = open('train.py', encoding='utf-8').read()
marker = 'if __name__ == "__main__":\n    train_model()\n'
idx = content.find(marker)
if idx != -1:
    clean = content[:idx + len(marker)]
    open('train.py', 'w', encoding='utf-8').write(clean)
    print(f'Cleaned OK. Line count: {clean.count(chr(10))}')
else:
    print('Marker not found')
