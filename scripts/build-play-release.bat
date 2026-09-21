@echo off
setlocal enabledelayedexpansion

echo ====================================================
echo  🛡️ ZeePrep Production Play Store Release (.AAB)
echo ====================================================
echo.

cd /d "%~dp0\.."

echo [1/5] 🔍 Checking Git repository status...
git status -s
echo.
for /f "tokens=*" %%g in ('git rev-parse --short HEAD') do (set GIT_SHA=%%g)
for /f "tokens=*" %%b in ('git rev-parse --abbrev-ref HEAD') do (set GIT_BRANCH=%%b)
echo Git Branch: %GIT_BRANCH%
echo Git Commit: %GIT_SHA%
echo.

echo [2/5] 📋 Inspecting App Identity and Versioning...
node -e "const a = require('./app.json'); console.log('Package ID:   ' + a.expo.android.package); console.log('Version:      ' + a.expo.version); console.log('VersionCode:  ' + a.expo.android.versionCode);"
echo.

echo [3/5] 🧪 Running TypeScript Verification...
call npm run typecheck
if errorlevel 1 (
    echo ❌ TypeScript validation failed! Aborting release build.
    exit /b 1
)
echo ✓ TypeScript check passed with 0 errors.
echo.

echo [4/5] 🔨 Compiling Signed Android App Bundle (.aab)...
cd android
call gradlew.bat bundleRelease
if errorlevel 1 (
    echo ❌ Gradle bundleRelease failed!
    exit /b 1
)

set AAB_PATH=app\build\outputs\bundle\release\app-release.aab
if not exist "%AAB_PATH%" (
    echo ❌ Error: AAB artifact not found at %AAB_PATH%
    exit /b 1
)

echo.
echo [5/5] 📦 Artifact Verification:
echo ====================================================
echo  🎉 RELEASE BUNDLE COMPILED SUCCESSFULLY!
echo ====================================================
echo  Artifact Location: %~dp0..\android\%AAB_PATH%
echo  Target Package:    com.skillizee.zeeprep
echo  Git Commit:        %GIT_SHA%
echo  Build Timestamp:   %date% %time%
echo ====================================================
echo.
echo  🛑 HARD STOP: The AAB is ready locally.
echo  Next Step: Manually upload this AAB to Google Play Console:
echo  1. Go to Google Play Console -> ZeePrep (com.skillizee.zeeprep)
echo  2. Select: Release -> Testing -> Internal testing
echo  3. Upload: %AAB_PATH%
echo.
