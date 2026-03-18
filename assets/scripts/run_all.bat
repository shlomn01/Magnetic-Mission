@echo off
set ASEPRITE="C:\Program Files (x86)\Steam\steamapps\common\Aseprite\Aseprite.exe"
set SCRIPTS=C:\Users\shlom\projects\DNA Game\assets\scripts

echo Generating title background...
%ASEPRITE% --batch --script "%SCRIPTS%\gen_title_bg.lua"
if %ERRORLEVEL% NEQ 0 echo FAILED: title_bg

echo Generating ship sprite...
%ASEPRITE% --batch --script "%SCRIPTS%\gen_ship.lua"
if %ERRORLEVEL% NEQ 0 echo FAILED: ship

echo Generating corridor background...
%ASEPRITE% --batch --script "%SCRIPTS%\gen_corridor_bg.lua"
if %ERRORLEVEL% NEQ 0 echo FAILED: corridor_bg

echo Generating lab background...
%ASEPRITE% --batch --script "%SCRIPTS%\gen_lab_bg.lua"
if %ERRORLEVEL% NEQ 0 echo FAILED: lab_bg

echo Generating galvanometer...
%ASEPRITE% --batch --script "%SCRIPTS%\gen_galvanometer.lua"
if %ERRORLEVEL% NEQ 0 echo FAILED: galvanometer

echo Generating needle...
%ASEPRITE% --batch --script "%SCRIPTS%\gen_needle.lua"
if %ERRORLEVEL% NEQ 0 echo FAILED: needle

echo Generating compass rose...
%ASEPRITE% --batch --script "%SCRIPTS%\gen_compass_rose.lua"
if %ERRORLEVEL% NEQ 0 echo FAILED: compass_rose

echo Generating portraits...
%ASEPRITE% --batch --script "%SCRIPTS%\gen_portraits.lua"
if %ERRORLEVEL% NEQ 0 echo FAILED: portraits

echo Generating doors...
%ASEPRITE% --batch --script "%SCRIPTS%\gen_doors.lua"
if %ERRORLEVEL% NEQ 0 echo FAILED: doors

echo Generating UI elements...
%ASEPRITE% --batch --script "%SCRIPTS%\gen_ui_elements.lua"
if %ERRORLEVEL% NEQ 0 echo FAILED: ui_elements

echo.
echo Done! Checking outputs...
dir /s /b "C:\Users\shlom\projects\DNA Game\assets\*.png" 2>nul
if %ERRORLEVEL% NEQ 0 echo No PNG files found!
pause
