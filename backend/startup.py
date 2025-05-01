import subprocess
import requests
import json
import time
import re
import sys
import argparse
import os
import socket

# AWS Lambda API URL
REGISTER_URL = "https://83xt4e7ki5.execute-api.ap-northeast-2.amazonaws.com/capston_backend/register"

def check_port_in_use(host, port):
    """지정된 포트가 이미 사용 중인지 확인"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0

def test_server_connection(host, port, max_attempts=10, delay=3):
    """백엔드 서버가 응답하는지 테스트"""
    for i in range(max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex((host, port))
                if result == 0:
                    print(f"백엔드 서버가 {host}:{port}에서 응답합니다.")
                    return True
            print(f"백엔드 서버 연결 시도 중... ({i+1}/{max_attempts})")
            time.sleep(delay)
        except Exception as e:
            print(f"연결 테스트 중 오류: {e}")
            time.sleep(delay)
    
    print(f"백엔드 서버가 {host}:{port}에서 응답하지 않습니다.")
    return False

def get_ngrok_url():
    # ngrok API를 통해 현재 터널 정보 조회
    try:
        response = requests.get("http://127.0.0.1:4040/api/tunnels")
        tunnels = json.loads(response.text)["tunnels"]
        
        for tunnel in tunnels:
            # https 또는 http 프로토콜로 생성된 터널 URL 반환
            if tunnel["proto"] in ["https", "http"]:
                return tunnel["public_url"]
        
        return None
    except Exception as e:
        print(f"ngrok API 접근 중 오류 발생: {e}")
        return None

def register_url(url):
    # AWS Lambda에 URL 등록
    payload = {"url": url}
    try:
        response = requests.post(REGISTER_URL, json=payload)
        print(f"URL 등록 결과: {response.status_code}")
        print(response.text)
        return True
    except Exception as e:
        print(f"URL 등록 중 오류 발생: {e}")
        return False

def find_ngrok_path():
    """시스템에서 ngrok 실행 파일을 찾는 함수"""
    # 일반적인 설치 경로들
    possible_paths = [
        "ngrok",                           # 시스템 PATH에 있는 경우
        "C:\\ngrok\\ngrok.exe",            # 일반적인 설치 경로 1
        "C:\\Program Files\\ngrok\\ngrok.exe",  # 일반적인 설치 경로 2
        os.path.expanduser("~\\ngrok.exe"),     # 사용자 홈 디렉토리
        os.path.join(os.getcwd(), "ngrok.exe"), # 현재 작업 디렉토리
        os.path.join(os.path.dirname(os.getcwd()), "ngrok.exe"), # 상위 디렉토리
    ]
    
    for path in possible_paths:
        try:
            # 파일이 존재하고 실행 가능한지 확인
            if path == "ngrok" or os.path.isfile(path):
                # 간단히 버전 체크를 시도하여 실제 ngrok인지 확인
                result = subprocess.run([path, "version"], 
                                        stdout=subprocess.PIPE, 
                                        stderr=subprocess.PIPE, 
                                        check=False,
                                        timeout=2)
                if result.returncode == 0:
                    print(f"찾은 ngrok 경로: {path}")
                    return path
        except Exception:
            continue
    
    return None

def parse_args():
    parser = argparse.ArgumentParser(description='백엔드 서버와 ngrok 터널링 시작')
    parser.add_argument('--port', type=int, default=8000, help='백엔드 서버 포트 (기본값: 8000)')
    parser.add_argument('--ngrok-path', type=str, default=None, help='ngrok 실행 파일 경로 (예: C:\\ngrok\\ngrok.exe)')
    parser.add_argument('--ngrok-args', type=str, default='', help='ngrok에 전달할 추가 인자 (예: "--region=ap")')
    parser.add_argument('--fixed-domain', type=str, default='llama-lucky-mullet.ngrok-free.app', help='고정 도메인 (기본값: llama-lucky-mullet.ngrok-free.app)')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='백엔드 서버 호스트 (기본값: 0.0.0.0)')
    parser.add_argument('--disable-ngrok', action='store_true', help='ngrok 없이 백엔드 서버만 실행')
    parser.add_argument('--skip-check', action='store_true', help='백엔드 서버 응답 테스트 건너뛰기')
    parser.add_argument('--wait-time', type=int, default=10, help='백엔드 서버 시작 대기 시간(초) (기본값: 10)')
    
    return parser.parse_args()

def main():
    args = parse_args()
    port = args.port
    host = args.host
    
    print("=== 백엔드 서버 및 ngrok 터널링 시작 ===")
    
    # 포트가 이미 사용 중인지 확인
    if check_port_in_use(host, port):
        print(f"경고: 포트 {port}가 이미 사용 중입니다. 다른 포트를 사용하거나 기존 프로세스를 종료하세요.")
        print("기존 프로세스를 종료하려면 관리자 권한으로 다음 명령어를 실행하세요:")
        print(f"netstat -ano | findstr :{port}")
        print(f"taskkill /PID <프로세스ID> /F")
        return
    
    # 백엔드 서버 시작
    print(f"백엔드 서버 시작: {host}:{port}")
    backend_process = subprocess.Popen(
        ["uvicorn", "app:app", "--host", host, "--port", str(port)]
    )
    
    # 서버가 시작될 때까지 잠시 대기
    print(f"백엔드 서버 시작 대기 중... ({args.wait_time}초)")
    time.sleep(args.wait_time)
    
    # 서버 연결 테스트 (skip-check 옵션이 있으면 건너뜀)
    server_running = True
    if not args.skip_check:
        server_running = test_server_connection('127.0.0.1', port)
        if not server_running:
            response = input("백엔드 서버가 응답하지 않습니다. 계속 진행하시겠습니까? (y/n): ")
            if response.lower() != 'y':
                print("프로그램을 종료합니다.")
                backend_process.terminate()
                return
            else:
                print("서버 응답 없이 계속 진행합니다.")
                server_running = True

    # ngrok 비활성화 옵션이 있거나 ngrok 실행 파일 경로가 'none'인 경우 ngrok을 실행하지 않음
    if args.disable_ngrok or (args.ngrok_path and args.ngrok_path.lower() == 'none'):
        print("ngrok 실행이 비활성화되었습니다. 백엔드 서버만 실행됩니다.")
        print(f"백엔드 서버는 http://{host}:{port}에서 실행 중입니다.")
    else:
        # ngrok 경로 확인
        ngrok_path = args.ngrok_path or find_ngrok_path()
        
        if not ngrok_path:
            print("ngrok 실행 파일을 찾을 수 없습니다. 다음 방법 중 하나를 사용하세요:")
            print("1. --ngrok-path 인자로 ngrok 경로 직접 지정 (예: --ngrok-path=\"C:\\ngrok\\ngrok.exe\")")
            print("2. ngrok을 시스템 PATH에 추가")
            print("3. ngrok 실행 파일을 현재 디렉토리나 상위 디렉토리에 복사")
            print("백엔드 서버만 실행됩니다. 외부에서 접근이 불가능할 수 있습니다.")
        else:
            # ngrok 명령어 구성 - localhost 대신 127.0.0.1 명시적 사용
            ngrok_cmd = [ngrok_path, "http", "--domain=" + args.fixed_domain, "127.0.0.1:" + str(port)]
            
            # 추가 인자가 있으면 명령어에 추가
            if args.ngrok_args:
                ngrok_cmd.extend(args.ngrok_args.split())
            
            print(f"ngrok 실행 명령어: {' '.join(ngrok_cmd)}")
            
            # ngrok 시작
            try:
                ngrok_process = subprocess.Popen(ngrok_cmd)
                
                # ngrok이 시작될 때까지 대기
                print("ngrok 시작 대기 중...")
                time.sleep(5)
                
                # URL 가져오기
                url = f"https://{args.fixed_domain}"
                print(f"고정 ngrok URL 사용: {url}")
                print(f"브라우저에서 {url} 주소로 접속해 보세요.")
                register_success = register_url(url)
                
                if register_success:
                    print(f"백엔드 URL이 성공적으로 등록되었습니다: {url}")
                    print("이제 프론트엔드에서 API 요청이 가능합니다.")
                else:
                    print("URL 등록에 실패했습니다. 프론트엔드와의 통신이 원활하지 않을 수 있습니다.")
            except Exception as e:
                print(f"ngrok 실행 중 오류 발생: {e}")
                print("백엔드 서버만 실행됩니다. 외부에서 접근이 불가능할 수 있습니다.")
    
    print("종료하려면 Ctrl+C를 누르세요...")
    
    try:
        # 프로세스가 종료될 때까지 대기
        backend_process.wait()
    except KeyboardInterrupt:
        print("서버 종료 중...")
        backend_process.terminate()
        try:
            if 'ngrok_process' in locals():
                ngrok_process.terminate()
        except:
            pass
        print("서버가 종료되었습니다.")

if __name__ == "__main__":
    main()