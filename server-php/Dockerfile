FROM php:8.2-apache

# Install PostgreSQL driver dependencies + PHP extension
RUN apt-get update \
    && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Enable Apache rewrite module (required to route /api/* through index.php)
RUN a2enmod rewrite

# Copy backend into Apache's web root
COPY server-php/ /var/www/html/

# Allow .htaccess to override Apache config (needed for the rewrite rule below)
RUN sed -ri -e 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

WORKDIR /var/www/html

EXPOSE 80