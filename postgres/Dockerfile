FROM postgres:15

# Environment variables for the database
ENV POSTGRES_DB=smarthome
ENV POSTGRES_USER=smarthome
ENV POSTGRES_PASSWORD=smarthome123

# Copy initialization scripts
COPY ./init-db.sql /docker-entrypoint-initdb.d/

# Expose the PostgreSQL port
EXPOSE 5432