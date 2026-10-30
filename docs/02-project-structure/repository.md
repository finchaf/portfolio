# Структура репозитория

**Статус:** спецификация — кода сайта нет на 30.10.2026

> Как разложен репозиторий и как называются файлы. Открывать перед новым файлом. Разойдётся с
> репозиторием — прав репозиторий, документ правится в той же задаче.

```
portfolio/
├── src/
│   ├── app/
│   │   ├── [locale]/            все страницы; корневой layout здесь
│   │   │   ├── page.tsx         главная
│   │   │   ├── work/[slug]/     кейсы
│   │   │   └── cv/              страница резюме, из неё печатается PDF
│   │   ├── global-not-found.tsx 404 на двух языках
│   │   ├── sitemap.ts, robots.ts
│   │   └── globals.css          Tailwind, токены
│   ├── components/              компоненты страниц
│   ├── ui/                      базовые компоненты без текста
│   ├── motion/                  токены движения, примитивы, единая регистрация GSAP
│   ├── three/                   3D-сцены; импортируются только динамически
│   ├── demos/                   живые демонстрации для кейсов
│   ├── lib/                     чистые функции без React и ввода-вывода
│   ├── i18n/                    настройки next-intl
│   └── mdx-components.tsx
├── messages/<locale>/*.json     короткие строки
├── content/<locale>/work/*.mdx  кейсы
├── media/                       исходники медиа, Git LFS
├── public/                      статика как есть; public/media создаёт сборка
├── e2e/                         Playwright
├── scripts/                     check.py и гейты, deploy.py, build-media.ts, compress.ts
├── deploy/Caddyfile.test        копия блока Caddy для гейта Addresses
├── docs/                        база знаний
├── .claude/                     скиллы `/nt`, `/si`, `/ar`, `/rf` и их агенты
├── .githooks/, .github/
├── next.config.ts, package.json, pnpm-workspace.yaml, tsconfig.json
└── expected-build.json          какие маршруты обязаны появиться, бюджеты
```

`docs/private/` не входит в этот репозиторий ([ADR-0008](../01-architecture/decisions/0008-open-repository.md)).

## Правила

- **Файлы маршрутов тонкие.** Разметка и логика — в `components/` и `lib/`.
- **Клиентский компонент — только там, где есть состояние или эффект.** Текст приходит параметром с
  сервера, `NextIntlClientProvider` нет.
- **Тяжёлое импортируется динамически:** всё из `three/` и большие демонстрации.
- **Никакого текста в коде:** строки — в `messages/`, длинные тексты — в `content/`.
- **Тесты Vitest — рядом с кодом**, `<имя>.test.ts`; браузерные — в `e2e/`.
- **Имена:** файлы в `kebab-case`, компоненты в `PascalCase`.
- **Версии точные**, без `^`.
