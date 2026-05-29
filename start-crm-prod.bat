@echo off
echo ========================================
echo  TechTammina CRM - Production Startup
echo ========================================

REM Create logs directory structure if it doesn't exist
if not exist "logs" mkdir logs
if not exist "logs\archived" mkdir logs\archived

echo [INFO] Created logging directories

REM Set production profile
set SPRING_PROFILES_ACTIVE=PROD

echo [INFO] Starting CRM in PRODUCTION mode...
echo [INFO] Logs will be written to: logs/crm-application.log
echo [INFO] Error logs will be written to: logs/crm-errors.log
echo [INFO] Security logs will be written to: logs/crm-security.log
echo [INFO] Business logs will be written to: logs/crm-business.log

REM Navigate to backend directory
cd crm-customer-service

REM Build the application
echo [INFO] Building application...
call mvnw.cmd clean package -DskipTests

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo [INFO] Build successful!

REM Start the application with production profile and optimized JVM settings
echo [INFO] Starting CRM application with optimized memory settings...
echo [INFO] JVM Settings: -Xms2g -Xmx4g -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m
echo [INFO] GC Settings: G1GC with optimized parameters

java -Xms2g -Xmx4g ^-XX:MetaspaceSize=256m ^-XX:MaxMetaspaceSize=512m ^-XX:+UseG1GC ^-XX:G1HeapRegionSize=16m ^-XX:+UseStringDeduplication ^-XX:+OptimizeStringConcat ^-XX:MaxGCPauseMillis=200 ^-XX:+UnlockExperimentalVMOptions ^-XX:+UseJVMCICompiler ^-Dspring.profiles.active=prod ^-Dfile.encoding=UTF-8 ^-Djava.awt.headless=true ^-jar target/crm-customer-service-0.0.1-SNAPSHOT.jar

pause