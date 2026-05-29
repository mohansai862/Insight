@echo off
echo ========================================
echo  TechTammina CRM - Development Mode
echo ========================================
echo.
echo Building and starting CRM application on port 8081...
echo Profile: Development
echo Database: Local MySQL (crm_test)
echo Frontend: React dev server on port 4201
echo.

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs
echo [INFO] Logging directory ready: logs/

cd crm-customer-service
call mvnw.cmd clean package -DskipTests -U -U
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Starting Spring Boot application in development mode with optimized memory settings...
echo [INFO] JVM Settings: -Xms1g -Xmx2g for development

java -Xms1g -Xmx2g ^-XX:MetaspaceSize=128m ^-XX:MaxMetaspaceSize=256m ^-XX:+UseG1GC ^-XX:G1HeapRegionSize=8m ^-XX:+UseStringDeduplication ^-XX:MaxGCPauseMillis=100 ^-Dspring.profiles.active=dev ^-Dfile.encoding=UTF-8 ^-jar target/crm-customer-service-0.0.1-SNAPSHOT.jar

pause