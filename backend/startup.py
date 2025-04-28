import subprocess
import requests
import json
import time
import re
import sys

# AWS Lambda API URL
REGISTER_URL = "https://83xt4e7ki5.execute-api.ap-northeast-2.amazonaws.com/capston_backend/register"

def get_ngrok_url():
    # ngrok API를 통해 현재 터널 정보 조회
    response = requests.get("http://localhost:4040/api/tunnels")
    tunnels = json.loads(response.text)["tunnels"]
    
    for tunnel in tunnels:
        if tunnel["proto"] == "https":
            return tunnel["public_url"]
    
    return None

def register_url(url):
    # AWS Lambda에 URL 등록
    payload = {"url": url}
    response = requests.post(REGISTER_URL, json=payload)
    print(f"URL 등록 결과: {response.status_code}")
    print(response.text)

def main():
    # 백엔드 서버 시작
    backend_process = subprocess.Popen(
        ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
    )
    
    # ngrok 시작
    ngrok_process = subprocess.Popen(
        ["C:\\ngrok\\ngrok.exe", "http", "8000"]
    )
    
    # ngrok이 시작될 때까지 대기
    print("ngrok 시작 대기 중...")
    time.sleep(5)
    
    # URL 가져오기
    url = get_ngrok_url()
    if url:
        print(f"ngrok URL: {url}")
        register_url(url)
    else:
        print("ngrok URL을 찾을 수 없습니다.")
    
    try:
        # 프로세스가 종료될 때까지 대기
        backend_process.wait()
    except KeyboardInterrupt:
        print("서버 종료 중...")
        backend_process.terminate()
        ngrok_process.terminate()

if __name__ == "__main__":
    main()