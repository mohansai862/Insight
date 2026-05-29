@echo off
echo Starting TechTammina CRM - Production Mode...
echo.
echo Building and starting CRM application on port 8081...
echo Profile: Production
echo Database: Remote MySQL (localhost:3306/crms)
echo.

REM Set production environment variables
set DB_USER=crms
set DB_PASSWORD=passw0rd
set JWT_SECRET=mySecretKey12345678901234567890123456789012345678901234567890
set MAIL_USER=crms-noreply@tammina.in
set MAIL_PASS=U9e31N69ZWWN

cd crm-customer-service
call mvnw.cmd clean package -DskipTests -U
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Starting Spring Boot application in production mode...
java -jar target/crm-customer-service-0.0.1-SNAPSHOT.jar --spring.profiles.active=PROD

pause