# Инфраструктура

**Статус:** спецификация — домена и сайта на сервере нет на 30.10.2026

> Где живёт сайт, что меняется на общем сервере, в каком порядке всё запускается и как чинить.
> Открывать перед покупкой домена, первой выкаткой и при любом сбое. Решения —
> [ADR-0002](decisions/0002-static-export-on-caddy.md), [ADR-0005](decisions/0005-atomic-deploy-from-laptop.md),
> [ADR-0006](decisions/0006-domains-and-mail.md).

Сервер принадлежит продукту «Пора на пару». Всё о нём — учётные записи, вход, тариф, бэкапы —
живёт в `poranaparu/backend`, `docs/infrastructure.md` и `docs/runbook.md`. Здесь только то, что
относится к сайту. Секретов и личных данных здесь нет.

## Сервер сегодня

Снято 30.10.2026 командой `ssh poranaparu-prod 'df -h /; free -m'`.

| Что | Значение |
| --- | --- |
| Диск | 5,6 ГБ занято, 33 ГБ свободно |
| Память | 753 МБ занято из 1 895, доступно 1 142 |

Сайт добавит только файлы на диск. Новых процессов не будет.

## Что меняется в бэкенде

Правка — PR в `poranaparu/backend`, один раз. Она согласована (владелец, 30.10.2026).

**`deploy/compose.prod.yaml`**, сервис `caddy`:

```yaml
- ./portfolio:/srv/portfolio:ro
```

Папку надо создать **до** выкатки, иначе Docker создаст её от root:

```
ssh poranaparu-prod 'mkdir -p /opt/poranaparu/portfolio/releases'
```

**`deploy/Caddyfile`**, два блока. Основа проверена на Caddy 2.11.4 в прототипе; редирект с косой
чертой и сохранение строки запроса при выборе языка проверяются гейтом Addresses.

```caddyfile
finchaf.com {
	import edge
	header {
		Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'"
		Referrer-Policy "strict-origin-when-cross-origin"
		Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
	}
	root * /srv/portfolio/current
	@bare path /
	handle @bare {
		header Vary Accept-Language
		@en {
			header Accept-Language *
			not header_regexp Accept-Language ^\s*ru
		}
		redir @en /en 302
		redir * /ru 302
	}
	handle /_next/static/* {
		header Cache-Control "public, max-age=31536000, immutable"
		file_server {
			precompressed br gzip
		}
	}
	handle {
		header Cache-Control "public, max-age=0, must-revalidate"
		try_files {path} {path}.html {path}/index.html
		file_server {
			precompressed br gzip
		}
	}
	handle_errors 404 {
		rewrite * /404.html
		file_server {
			status 404
		}
	}
}

www.finchaf.com, finchaf.ru, www.finchaf.ru {
	import edge
	redir https://finchaf.com{uri} permanent
}
```

Перезапуск Caddy при `make deploy` прерывает все домены сервера на несколько секунд, поэтому не в
утренний пик API.

Копия этого блока лежит в `deploy/Caddyfile.test` и служит гейту Addresses. При изменении правятся оба
файла, а `scripts/deploy.py` сверяет заголовки на проде после каждой выкатки.

## Папки на сервере

```
/opt/poranaparu/portfolio/
├── current -> releases/<коммит>     что отдаётся; переключается атомарно
└── releases/<коммит>/               три последних релиза
```

Бэкапа нет и не нужно: сайт собирается заново из git. Копия есть в ежедневном снимке диска.

## Первый запуск

Порядок важен: сертификат выпускается, только когда домен уже ведёт на сервер.

1. **Владелец:** купить домены в `timeweb.cloud`, скрыть WHOIS, подтвердить `.ru` через Госуслуги.
2. **Владелец:** DNS по [ADR-0006](decisions/0006-domains-and-mail.md), почта и алиасы. Новая запись
   доходит до всех серверов Timeweb до часа.
3. **Проверка:** `dig finchaf.com +short` отдаёт адрес сервера.
4. Влить PR в `backend`, создать папку, `make deploy` вне пика.
5. `python3 scripts/deploy.py` из этого репозитория.
6. Проверить `https://finchaf.com`, `www`, `.ru`, сертификаты.
7. Завести монитор Better Stack на `https://finchaf.com/ru`.
8. Подтвердить домен в Яндекс Вебмастере и Search Console записями TXT и не удалять их.
9. Снять `finchaf-portfolio.vercel.app`: старый адрес не должен жить рядом с новым.

## Посещения

Сторонней аналитики нет: ни запросов на чужие серверы, ни cookie, ни баннера. Журнал Caddy уже пишет
запросы с маскированным IP и хранит их 14 дней. Отчёт делает отдельный скрипт, читающий журнал по
SSH. Сводку продукта `visits.py` не трогаем: её запросы не фильтруют хост, и наши строки исказили бы
её данные. Чтобы понять, открыли ли ссылку, в неё можно добавить метку `?r=<имя>`: она видна в журнале.

## Если что-то не работает

| Симптом | Что делать |
| --- | --- |
| Плохая выкатка | `python3 scripts/deploy.py --rollback` |
| Сайт не открывается, продукт тоже | Caddy или сервер: `docs/runbook.md` бэкенда |
| Сайт не открывается, продукт работает | Проверить `current`: ссылка должна вести на существующий релиз |
| Сертификат не выпустился | Проверить A-запись, затем журнал Caddy |
| Сервер уходит | Скопировать `current` на новый хост, поменять A и AAAA, это час работы |
| Читатель за границей жалуется на скорость | CDN перед сервером нельзя: ADR-0001 бэкенда. Оптимизировать медиа, затем думать о зеркале EN-версии |
