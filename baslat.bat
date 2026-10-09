@echo off
cd /d "%~dp0"
echo Gerekli paketler kontrol ediliyor...
python -m pip install -r requirements.txt --quiet
echo.
echo Portal baslatiliyor. Bu pencereyi kapatmayin.
echo Bilgisayardan:  http://localhost:8000
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do echo Telefondan (ayni Wi-Fi): http://%%a:8000
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
