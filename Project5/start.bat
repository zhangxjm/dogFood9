@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ========================================
echo   FraudGuard Anti-Fraud System
echo   Startup Script
echo ========================================
echo.

set DATA_DIR=%~dp0data
if not exist "%DATA_DIR%" (
    mkdir "%DATA_DIR%"
    echo Created data directory: %DATA_DIR%
)

echo Checking Java environment...
where java >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed. Please install Java 17 or higher.
    pause
    exit /b 1
)

for /f "tokens=3" %%v in ('java -version 2^>^&1 ^| findstr /i "version"') do (
    set JAVA_VERSION=%%~v
)
echo Java version: %JAVA_VERSION%

echo.
echo Checking Maven...
where mvn >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Maven is not installed. Please install Maven 3.6 or higher.
    pause
    exit /b 1
)

echo.
echo Building project...
call mvn clean package -DskipTests -q
if %errorlevel% neq 0 (
    echo ERROR: Build failed.
    pause
    exit /b 1
)
echo Build completed successfully.

set JAR_FILE=
for %%f in (target\*.jar) do (
    set JAR_FILE=%%f
    goto :found_jar
)
:found_jar

if "%JAR_FILE%"=="" (
    echo ERROR: JAR file not found.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Starting FraudGuard System...
echo ========================================
echo.
echo Application URL: http://localhost:8080
echo Health Check:    http://localhost:8080/actuator/health
echo.
echo Press Ctrl+C to stop the server.
echo.

set JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseG1GC -Dfile.encoding=UTF-8

java %JAVA_OPTS% -jar "%JAR_FILE%"

pause
