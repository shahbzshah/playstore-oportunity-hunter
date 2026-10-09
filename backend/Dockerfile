FROM php:8.3-apache

# System deps: sqlite driver, zip, supervisor (queue worker), apache rewrite.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libsqlite3-dev \
        libzip-dev \
        unzip \
        supervisor \
    && docker-php-ext-install pdo_sqlite bcmath zip \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

WORKDIR /var/www/html

# Application code (build context is the repo root).
COPY backend/ ./

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress \
    && mkdir -p database \
    && touch database/database.sqlite \
    && chown -R www-data:www-data storage bootstrap/cache database \
    && php artisan config:clear

COPY backend/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY backend/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

CMD ["/entrypoint.sh"]
