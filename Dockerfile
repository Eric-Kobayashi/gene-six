FROM ghcr.io/nginx/nginx-unprivileged:stable-alpine

# The base image runs as a non-root user and listens on port 8080.
COPY index.html style.css app.js game.js genes.json favicon.svg /usr/share/nginx/html/

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
