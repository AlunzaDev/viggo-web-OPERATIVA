# syntax=docker/dockerfile:1.7

FROM node:22.12.0-alpine3.20 AS builder

WORKDIR /project

ARG APP_ENV=prod

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY public ./public
COPY src ./src

RUN --mount=type=secret,id=frontend_env,target=/run/secrets/frontend_env,required=true \
    cp /run/secrets/frontend_env .env.${APP_ENV}

RUN npx tsc -b && npx vite build --mode ${APP_ENV}

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /project/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
