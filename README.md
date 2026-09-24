# Interpro frontend

Frontend на React Router 7 с серверным рендерингом. Production assets раздаются через `https://cdn.interpro.pro`.

## Обновить production

Основная команда для обычного production deploy после внесения исправлений:

```bash
npm run deploy:prod
```

Она собирает release, публикует и проверяет assets через CDN, а затем переключает frontend. Если публикация или проверка завершится с ошибкой, production не переключится.

Для возврата к предыдущему release:

```bash
npm run rollback:prod
```

Команды можно запускать из обычного терминала IDE или PowerShell: npm сам откроет Git Bash на Windows. Подробности и ручной двухэтапный режим описаны ниже.

## Локальная разработка

Требуются Node.js 22 и npm.

Установить зависимости:

```bash
npm install
```

Запустить dev-сервер:

```bash
npm run dev
```

Приложение будет доступно на `http://localhost:5027`.

Основные проверки:

```bash
npm test
npm run typecheck
npm run build
```

Запустить уже собранное приложение:

```bash
npm run start
```

Обычная локальная сборка не требует `VITE_ASSET_BASE_URL`: ссылки на assets останутся локальными.

## Локальный Docker

`docker-compose.yml` является основным Compose-файлом. Он собирает frontend и отдельный Playwright-сервис.

Один раз создать внешнюю сеть:

```bash
docker network create proxy-network
```

Собрать и запустить контейнеры:

```bash
docker compose up -d --build
```

Проверить состояние и посмотреть логи:

```bash
docker compose ps
docker compose logs -f
```

Остановить контейнеры:

```bash
docker compose down
```

Compose открывает порт `5027` только внутри Docker-сетей. Для доступа с компьютера нужен reverse proxy в сети `proxy-network` или временное добавление `ports` в локальную конфигурацию.

## Какой Compose-файл использовать

- Для локального Docker используется `docker-compose.yml`.
- Для production используется `npm run deploy:prod`, который вызывает `scripts/deploy.sh`.
- `docker-compose.deploy.yml` отдельно не запускается.
- Deploy-скрипт сам объединяет `docker-compose.yml` и `docker-compose.deploy.yml`.

Production overlay закрепляет frontend по точному image digest и запускает `asset-origin`, который раздаёт сохранённые CDN assets.

## Production deployment

Deploy-скрипт использует Bash. На Windows npm-команды автоматически находят Git Bash; на Linux и WSL используется системный `bash`. При нестандартном расположении Bash путь можно задать через `DEPLOY_BASH`.

Локально требуются `git`, `node`, `npm`, `docker`, `curl`, `ssh`, `tar`, `sha256sum`, `awk` и GNU coreutils. На сервере должны работать Docker Compose, reverse proxy и CDN origin.

Для обычного deploy достаточно одной команды:

```bash
npm run deploy:prod
```

Внутри команды по-прежнему соблюдается безопасный порядок: build, публикация assets, полная CDN-проверка и только затем переключение frontend.

Ручной двухэтапный режим нужен, если требуется остановиться после публикации и переключить production позже.

### 1. Опубликовать release

Сначала можно посмотреть параметры без сборки и изменений:

```bash
scripts/deploy.sh --dry-run
```

Создать release:

```bash
scripts/deploy.sh --publish-assets
```

Команда:

- собирает приложение для `cdn.interpro.pro`;
- добавляет новые hashed assets в persistent-каталог, не удаляя старые;
- проверяет каждый asset через CDN;
- собирает и загружает точный runtime image;
- выводит `Ready release: RELEASE_ID` и команду следующего шага.

На этом шаге работающий frontend не переключается.

При необходимости можно задать понятное имя release:

```bash
scripts/deploy.sh --publish-assets --tag RELEASE_ID
```

Имя должно начинаться с буквы или цифры и может содержать только буквы, цифры, `_`, `.` и `-`. Повторно использовать имя нельзя, включая неудачные публикации.

### 2. Переключить frontend

Подставить ID, который напечатал первый шаг:

```bash
scripts/deploy.sh --deploy-server RELEASE_ID
```

Скрипт переключит production на проверенный image, выполнит health checks и сохранит предыдущий release для rollback.

Не запускайте этот шаг, если публикация не завершилась сообщением `Ready release`.

### Rollback

Вернуться к предыдущему успешно зафиксированному release:

```bash
npm run rollback:prod
```

ID указывать не нужно: скрипт берёт предыдущий release из deployment state.

## Production defaults

```text
DEPLOY_SSH=interpro
DEPLOY_DIR=/root/interpro/frontend
DEPLOY_ASSET_DIR=/srv/interpro-assets
DEPLOY_CDN_ORIGIN=https://cdn.interpro.pro
DEPLOY_IMAGE=interpro-frontend
DEPLOY_STATE_DIR=$DEPLOY_DIR/.deploy
```

Значения можно переопределить переменными окружения:

```bash
DEPLOY_SSH=user@example.com DEPLOY_DIR=/srv/interpro/frontend scripts/deploy.sh --dry-run
```

`DEPLOY_CDN_ORIGIN` должен быть HTTPS origin без пути и завершающего `/`. Если задан `VITE_ASSET_BASE_URL`, он должен полностью совпадать с `DEPLOY_CDN_ORIGIN`.

## Важно

- Не запускайте `docker-compose.deploy.yml` отдельно.
- Не переключайте production вручную через `docker compose up`.
- Не удаляйте старые файлы из `/srv/interpro-assets`: cached pages и rollback releases могут ссылаться на старые hashes.
- Assets и Docker images автоматически не удаляются.
- `docker-compose.yml`, `docker-compose.deploy.yml` и `deploy/asset-origin.conf` должны находиться в `DEPLOY_DIR` на сервере до запуска deploy.
- На сервере должен существовать контейнер `nginx_proxy_manager`: скрипт очищает его HTML microcache при переключении и восстановлении.
- Скрипт обновляет уже подготовленный сервер. На нём должны существовать frontend, Playwright, Docker-сети и pinned image для `asset-origin`; первичная настройка пустого сервера выполняется отдельно.
- Если публикация была принудительно завершена и новый запуск сообщает о занятом lock, убедитесь, что другой deploy не работает, затем удалите каталог `.git/interpro-deploy-publish.lock`.
