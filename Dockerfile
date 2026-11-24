# ---- Build stage: compiles the Spring Boot API and bundles the React UI into one jar ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Cache Maven dependencies
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Copy sources (backend + frontend) and build; frontend-maven-plugin installs Node and runs the Vite build
COPY src ./src
COPY frontend ./frontend
RUN mvn -B clean package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/mail-minter-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
# Secrets are NOT baked into the image; pass them at runtime: docker run --env-file .env ...
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
