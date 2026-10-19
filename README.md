# Interpro frontend

Frontend на React Router 7 с серверным рендерингом. Production assets раздаются через `https://cdn.interpro.pro`.

## Обновить production

Подключиться к production-серверу, обновить checkout и запустить deploy:

```bash
ssh interpro
cd ~/interpro/frontend
git pull --ff-only origin dev
npm run deploy:prod
```

Команда выполняется на сервере. Она устанавливает зависимости, собирает release и Docker image, публикует и проверяет assets через CDN, затем переключает frontend. Локальный Docker и SSH из deploy-скрипта не используются. Если сборка или проверка завершается с ошибкой, работающий production не переключается.

Для возврата к предыдущему release:

```bash
npm run rollback:prod
```

Rollback также выполняется на production-сервере из каталога проекта.

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

Deploy запускается непосредственно на production-сервере. Для npm-команды требуются Node.js и `npm`; сама сборка приложения выполняется внутри Docker и не использует host `node_modules`. Также нужны `git`, `bash`, Docker с Compose plugin, `curl`, `flock`, `sha256sum`, `awk` и GNU coreutils. Reverse proxy и CDN origin должны уже работать.

Для обычного deploy достаточно одной команды:

```bash
git pull --ff-only origin dev
npm run deploy:prod
```

Скрипт деплоит текущий commit checkout и не выполняет `git pull` самостоятельно. Перед deploy рабочее дерево должно быть чистым. Каталог `.deploy/` игнорируется Git и хранит локальное состояние релизов.

Внутри команды соблюдается безопасный порядок:

- блокировка параллельных deploy и rollback через `flock`;
- установка зависимостей, production build и сборка runtime image внутри Docker на сервере;
- публикация immutable hashed assets в persistent-каталог;
- полная проверка assets через CDN;
- запуск и health-check Playwright-сервиса;
- переключение frontend на точный image ID;
- health check и автоматическое восстановление прежнего image при ошибке;
- фиксация предыдущего release для rollback.

Посмотреть параметры без сборки и изменений:

```bash
bash scripts/deploy.sh --dry-run
```

При необходимости можно задать понятное имя release:

```bash
bash scripts/deploy.sh --deploy --tag RELEASE_ID
```

Имя должно начинаться с буквы или цифры и может содержать только буквы, цифры, `_`, `.` и `-`. Повторно использовать имя нельзя, включая неудачные публикации.

### Rollback

Вернуться к предыдущему успешно зафиксированному release:

```bash
npm run rollback:prod
```

ID указывать не нужно: скрипт берёт предыдущий release из deployment state.

## Production defaults

```text
DEPLOY_ASSET_DIR=/srv/interpro-assets
DEPLOY_CDN_ORIGIN=https://cdn.interpro.pro
DEPLOY_IMAGE=interpro-frontend
DEPLOY_STATE_DIR=<checkout>/.deploy
```

Значения можно переопределить переменными окружения:

```bash
DEPLOY_ASSET_DIR=/srv/interpro-assets DEPLOY_STATE_DIR=/srv/interpro-deploy bash scripts/deploy.sh --dry-run
```

`DEPLOY_CDN_ORIGIN` должен быть HTTPS origin без пути и завершающего `/`. Если задан `VITE_ASSET_BASE_URL`, он должен полностью совпадать с `DEPLOY_CDN_ORIGIN`.

## Важно

- Не запускайте `docker-compose.deploy.yml` отдельно.
- Не переключайте production вручную через `docker compose up`.
- Не удаляйте старые файлы из `/srv/interpro-assets`: cached pages и rollback releases могут ссылаться на старые hashes.
- Assets и Docker images автоматически не удаляются.
- `docker-compose.yml`, `docker-compose.deploy.yml` и `deploy/asset-origin.conf` должны находиться в server checkout до запуска deploy.
- На сервере должен существовать контейнер `nginx_proxy_manager`: скрипт очищает его HTML microcache при переключении и восстановлении.
- Скрипт обновляет уже подготовленный сервер. На нём должны существовать frontend, Playwright, Docker-сети и pinned image для `asset-origin`; первичная настройка пустого сервера выполняется отдельно.
- `git pull` выполняется отдельно перед deploy. Скрипт никогда не переключает ветку и не изменяет историю Git.
- Если deploy сообщает о занятом lock, дождитесь завершения другого deploy или rollback; lock освобождается автоматически после завершения процесса.
