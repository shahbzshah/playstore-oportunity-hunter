#!/bin/bash
set -e

# Render injects $PORT; apache must listen on it.
PORT="${PORT:-80}"
sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

# Fresh sqlite file on first boot (ephemeral disk on free tier).
# Skipped when an external database is configured via DB_CONNECTION.
if [ "${DB_CONNECTION:-sqlite}" = "sqlite" ]; then
    touch /var/www/html/database/database.sqlite
    chown www-data:www-data /var/www/html/database/database.sqlite
fi

php /var/www/html/artisan migrate --force

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
