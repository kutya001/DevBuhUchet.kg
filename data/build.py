#!/usr/bin/env python3
"""Встраивает копию data/demoDB.json, data/TemDB.json, data/refDB.json в HTML прототипа.
Источник правды — файлы в папке data; встроенная копия нужна артефакту и открытию файла с диска.
Запуск: python3 build.py "Прототип Buhuchet.kg v31.html" [папка data]"""
import json,re,sys,os
html=sys.argv[1];data=sys.argv[2] if len(sys.argv)>2 else os.path.join(os.path.dirname(os.path.abspath(html)),'data')
s=open(html,encoding='utf8').read()
s=re.sub(r'<script type="application/json" id="db-(demo|tem|ref)">.*?</script>\n','',s,flags=re.S)
blocks=''
for id,name in [('demo','demoDB.json'),('tem','TemDB.json'),('ref','refDB.json')]:
    j=json.load(open(os.path.join(data,name),encoding='utf8'))
    assert j.get('meta',{}).get('file')==name, name
    t=json.dumps(j,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    blocks+=f'<script type="application/json" id="db-{id}">{t}</script>\n'
i=s.rfind('\n<script>')
s=s[:i+1]+blocks+s[i+1:]
open(html,'w',encoding='utf8').write(s)
print('embedded',len(blocks),'chars into',html)
