@echo off
REM Fetch the base web app and assemble the source tree in base\.
setlocal
cd /d %~dp0

if exist base (
  echo base\ already exists. Delete it to start over.
  exit /b 1
)

git clone https://github.com/jennymaeleidig/unofficial-homestuck-collection-web base
if errorlevel 1 exit /b 1
cd base
git checkout 1cf4339
if errorlevel 1 exit /b 1
git apply ..\patches\port.patch
if errorlevel 1 (
  echo Patch failed. Wrong base commit?
  exit /b 1
)
xcopy /e /y /q ..\overlay\* . >nul
cd ..
echo Done. Run build.cmd next.
