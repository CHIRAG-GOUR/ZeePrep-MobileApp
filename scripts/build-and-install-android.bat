@echo off
setlocal enabledelayedexpansion

echo ====================================================
echo  🚀 ZeePrep Fast Local Android Build ^& ADB Install
echo ====================================================
echo.

cd /d "%~dp0\..\android"
if not exist "gradlew.bat" (
    echo ❌ Error: gradlew.bat not found in android directory.
    exit /b 1
)

echo [1/3] 🔨 Compiling Release APK using local Gradle...
call gradlew.bat assembleRelease -x lint -x test
if errorlevel 1 (
    echo ❌ Gradle APK build failed!
    exit /b 1
)

set APK_PATH=app\build\outputs\apk\release\app-release.apk
if not exist "%APK_PATH%" (
    echo ❌ Error: Output APK not found at %APK_PATH%
    exit /b 1
)

echo.
echo [2/3] 🔍 Checking for connected Android devices...
adb devices
echo.

echo [3/3] 📲 Installing %APK_PATH% via ADB...
adb install -r "%APK_PATH%"
if errorlevel 1 (
    echo ⚠️ ADB install failed. Ensure USB debugging is enabled and device is authorized.
    exit /b 1
)

echo.
echo 🚀 Launching ZeePrep on device...
adb shell am start -n com.skillizee.zeeprep/.MainActivity

echo.
echo ====================================================
echo  ✅ APK successfully built and installed on device!
echo ====================================================
