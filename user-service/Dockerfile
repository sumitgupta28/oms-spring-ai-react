# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

COPY gradlew gradlew.bat ./
COPY gradle/ gradle/
COPY build.gradle settings.gradle ./

COPY shared-events/ shared-events/
COPY user-service/ user-service/

RUN chmod +x gradlew && \
    ./gradlew :user-service:bootJar --no-daemon -x test

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

RUN addgroup -S oms && adduser -S oms -G oms

WORKDIR /app
COPY --from=builder /workspace/user-service/build/libs/*.jar app.jar

USER oms
EXPOSE 8085
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
