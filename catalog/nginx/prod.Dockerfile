FROM node:18 AS build

WORKDIR /app
ARG WEBAPP_CONTEXT=webapp

COPY ${WEBAPP_CONTEXT}/package.json ${WEBAPP_CONTEXT}/package-lock.json ./
RUN npm install

COPY ${WEBAPP_CONTEXT}/vite.config.js ./
COPY ${WEBAPP_CONTEXT}/src src/
RUN npm run build

FROM nginx:1.23

ARG NGINX_CONTEXT=nginx

COPY ${NGINX_CONTEXT}/templates /etc/nginx/templates
COPY --from=build /app/dist /var/www/webapp
