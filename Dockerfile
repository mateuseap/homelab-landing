# Static landing page served by nginx. No build step: the site is plain
# HTML, CSS, JS, and JSON, copied straight in.
FROM nginx:alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css app.js favicon.svg architecture.svg /usr/share/nginx/html/
COPY i18n/ /usr/share/nginx/html/i18n/

EXPOSE 80
