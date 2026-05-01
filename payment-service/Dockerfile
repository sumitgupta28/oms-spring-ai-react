# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Gradle wrapper + root build files (cached layer — changes rarely)
COPY gradlew gradlew.bat ./
COPY gradle/ gradle/
COPY build.gradle settings.gradle ./

# Shared library (changes less often than service code)
COPY shared-events/ shared-events/

# Service source
COPY payment-service/ payment-service/

RUN chmod +x gradlew && \
    ./gradlew :payment-service:bootJar --no-daemon -x test

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

RUN addgroup -S oms && adduser -S oms -G oms

WORKDIR /app
COPY --from=builder /workspace/payment-service/build/libs/*.jar app.jar

USER oms
EXPOSE 8082
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
