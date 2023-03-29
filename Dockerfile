FROM nginx:stable-alpine3.17-slim
COPY dist /usr/share/nginx/html
