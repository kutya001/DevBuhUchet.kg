#!/usr/bin/env python3
"""Проверка версии прототипа Buhuchet.kg перед пушем в main (скилл .claude/skills/prototype-release).

Ловит то, что в пакете 14.11 уходило в main и чинилось следующим коммитом или ломало продукт
после синхронизации (docs/typical-mistakes.md продукта № 43, 47):
  - шаблон сообщения без списка подстановок в TPL_VARS или с чужой подстановкой — Админка → «Шаблоны»
    не сохраняет ни одного шаблона (v118);
  - длина шаблона больше предела Админки (2 000 знаков, кнопки — 40, скрытые ответы — 200);
  - ссылка новости на модуль, статью или видео, которых нет, — продукт не сохраняет такую новость
    (400 news_link, v116);
  - записей больше, чем продукт принимает одной формой (шаблонов — MESSAGE_TEMPLATES_FORM_MAX);
  - номер версии в <title>, PROTO_VER и новостях не сходится.

Запуск из корня репозитория: python3 check.py — код 0, если всё в порядке, иначе 1 и список ошибок.
Нужен только Python 3, без пакетов."""
import json, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
# Пределы продукта kutya001/Buhuchet.kg: поменялись там — поменять здесь.
PRODUCT_LIMITS = {
    # packages/shared/src/admin-system.ts, MESSAGE_TEMPLATES_FORM_MAX: «Сохранить шаблоны» шлёт все сразу
    'messageTemplates': 500,
}
# Пределы длины шаблона — как tplErr в src/js/admin/platform-dicts.js
TPL_MAX = 2000


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf8') as f:
        return f.read()


def tpl_vars():
    """TPL_VARS из src/js/ui/status-scale.js: ключ шаблона → разрешённые подстановки."""
    src = read('src/js/ui/status-scale.js')
    m = re.search(r'const TPL_VARS=\{(.*?)\};', src, re.S)
    if not m:
        raise SystemExit('Не нашёл const TPL_VARS в src/js/ui/status-scale.js')
    return {k: re.findall(r"'([^']*)'", v) for k, v in re.findall(r'(\w+):\[([^\]]*)\]', m.group(1))}


def module_ids():
    """Модули прототипа (src/js/core/registry.js, BIZ и ADM) — на них ведут ссылки новостей {k:'mod'}."""
    return set(re.findall(r"\{id:'([a-z0-9]+)',title:", read('src/js/core/registry.js')))


def tpl_limit(key):
    if key.startswith('tgBtn'):
        return 40
    if key.startswith('tgAct') or key == 'tgTestOk':
        return 200
    return TPL_MAX


def check():
    errors, warnings = [], []
    ref = json.loads(read('data/refDB.json'))
    for name in ('demoDB.json', 'TemDB.json', 'gkedDB.json', 'apiDocs.json'):
        try:
            json.loads(read('data/' + name))
        except ValueError as e:
            errors.append(f'data/{name}: не разбирается как JSON ({e})')

    # Шаблоны сообщений
    tv = tpl_vars()
    templates = ref.get('messageTemplates') or {}
    for key, text in templates.items():
        if key not in tv:
            errors.append(f'Шаблон {key}: нет в TPL_VARS (src/js/ui/status-scale.js) — Админка не сохранит шаблоны')
            continue
        bad = sorted({v for v in re.findall(r'\{([^{}]*)\}', text) if v not in tv[key]})
        if bad:
            errors.append(f'Шаблон {key}: подстановки {", ".join("{" + b + "}" for b in bad)} нет в TPL_VARS["{key}"]')
        if len(text) > tpl_limit(key):
            errors.append(f'Шаблон {key}: {len(text)} знаков, предел {tpl_limit(key)}')
    for key in sorted(set(tv) - set(templates)):
        warnings.append(f'TPL_VARS["{key}"] есть, а шаблона в refDB.messageTemplates нет')

    # Ссылки новостей
    mods = module_ids()
    arts = {a['id'] for a in ref.get('kbArticles', [])}
    videos = {v['id'] for v in ref.get('videos', [])}
    known = {'mod': mods, 'art': arts, 'video': videos}
    for n in ref.get('news', []):
        link = n.get('link')
        if not link:
            continue
        kind, id_ = link.get('k'), link.get('id')
        if kind not in known:
            errors.append(f'Новость {n["id"]}: ссылка неизвестного вида {kind!r}')
        elif id_ not in known[kind]:
            errors.append(f'Новость {n["id"]}: ссылка {{k:{kind!r}, id:{id_!r}}} — такого нет (модули: {", ".join(sorted(mods))})')

    # Числа записей против пределов продукта
    for section, limit in PRODUCT_LIMITS.items():
        count = len(ref.get(section) or {})
        if count > limit:
            errors.append(f'refDB.{section}: {count} записей, продукт принимает не больше {limit} — поднять предел в продукте')
        elif count > limit * 0.9:
            warnings.append(f'refDB.{section}: {count} записей из {limit} допустимых в продукте')

    # Номер версии
    title = re.search(r'<title>Прототип Buhuchet\.kg v(\d+)</title>', read('index.html'))
    proto = re.search(r"const PROTO_VER='v(\d+) ", read('src/js/ui/shell.js'))
    if not title or not proto:
        errors.append('Не нашёл номер версии в <title> index.html или PROTO_VER src/js/ui/shell.js')
    else:
        ver = proto.group(1)
        if title.group(1) != ver:
            errors.append(f'<title> v{title.group(1)}, а PROTO_VER v{ver}')
        news = {n['id']: n for n in ref.get('news', [])}
        if f'v{ver}' not in news:
            errors.append(f'Нет новости v{ver} в refDB.news')
        elif news[f'v{ver}'].get('status') != 'Опубликовано':
            errors.append(f'Новость v{ver} не опубликована')
        if f'v{int(ver) + 1}' not in news:
            warnings.append(f'Нет черновика «Версия {int(ver) + 1}: план» в refDB.news')
    return errors, warnings


if __name__ == '__main__':
    errors, warnings = check()
    for w in warnings:
        print('Предупреждение:', w)
    for e in errors:
        print('Ошибка:', e)
    if errors:
        sys.exit(1)
    print('Проверка прототипа: ошибок нет.')
