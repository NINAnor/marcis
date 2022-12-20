FROM node:18 AS build

WORKDIR /app
ARG WEBAPP_CONTEXT=webapp

COPY ${WEBAPP_CONTEXT}/package.json ${WEBAPP_CONTEXT}/package-lock.json ./
RUN npm install
COPY ${WEBAPP_CONTEXT}/vite.config.js ./

EXPOSE 4173/TCP
CMD ["npm", "run", "build-watch"]
