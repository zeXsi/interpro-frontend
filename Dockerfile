FROM node:22-bookworm-slim AS development-dependencies-env
COPY . /app
WORKDIR /app
ENV PLAYWRIGHT_BROWSERS_PATH=0
RUN npm ci --legacy-peer-deps

FROM node:22-bookworm-slim AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
ENV PLAYWRIGHT_BROWSERS_PATH=0
RUN npm ci --omit=dev --legacy-peer-deps

FROM node:22-bookworm-slim AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:22-bookworm-slim
COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
ENV PLAYWRIGHT_BROWSERS_PATH=0
RUN npx playwright install --with-deps chromium
EXPOSE 5027
ENV PORT=5027
CMD ["npm", "run", "start"]