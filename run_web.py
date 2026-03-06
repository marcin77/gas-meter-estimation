#!/usr/bin/env python3
import http.server, socketserver, webbrowser, os, sys, threading

script_dir = os.path.dirname(os.path.abspath(__file__))
dist_dir = os.path.join(script_dir, "dist")

if not os.path.exists(os.path.join(dist_dir, "index.html")):
    print("❌ Brak dist/index.html — uruchom najpierw: npm run build")
    sys.exit(1)

os.chdir(dist_dir)

handler = http.server.SimpleHTTPRequestHandler
handler.log_message = lambda *a: None

# Kluczowe — pozwala na natychmiastowe ponowne użycie portu
socketserver.TCPServer.allow_reuse_address = True

# Szukaj wolnego portu
port = 8080
httpd = None
for p in range(8080, 8100):
    try:
        httpd = socketserver.TCPServer(("localhost", p), handler)
        port = p
        break
    except OSError:
        continue

if not httpd:
    print("❌ Nie znaleziono wolnego portu (8080-8099)")
    sys.exit(1)

url = f"http://localhost:{port}"
print(f"⛽ Gas Meter Estimation → {url}")
print("Ctrl+C aby zatrzymać")

threading.Timer(0.5, lambda: webbrowser.open(url)).start()

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    print("\n👋 Zatrzymano")
    httpd.server_close()
