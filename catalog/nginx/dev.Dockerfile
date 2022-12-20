FROM nginx:1.23

ARG NGINX_CONTEXT=nginx

COPY ${NGINX_CONTEXT}/templates /etc/nginx/templates
