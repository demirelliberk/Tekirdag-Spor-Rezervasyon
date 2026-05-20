#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tekirdağ Spor Rezervasyon Sistemi — Sync Server

Bu sunucu iki görev yapar:
  1. Statik dosyaları (HTML/CSS/JS) serve eder (localhost:8080)
  2. /api/sync endpoint'i ile localStorage verilerini CSV dosyalarına yazar

Kullanım:
  python server.py

Tarayıcıda:
  http://localhost:8080/index.html
"""

import http.server
import json
import os
import sys
from urllib.parse import urlparse

class DoubleBookingError(Exception):
    """Veri yapısındaki düğüm kontrolü (boolean check) hatası"""
    pass

PORT = 8080
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')

# ==============================
# CSV YAZMA FONKSİYONLARI
# ==============================

def write_kullanicilar(data):
    """Kullanıcıları CSV'ye yazar."""
    headers = ['kullaniciId', 'adSoyad', 'email', 'sifre', 'rol']
    rows = []
    for i, u in enumerate(data):
        rows.append([
            u.get('kullaniciId', str(i + 1)),
            u.get('adSoyad', u.get('name', '')),
            u.get('email', ''),
            u.get('sifre', u.get('password', '')),
            u.get('rol', 'USER').upper()
        ])
    write_csv(os.path.join(DATA_DIR, 'kullanicilar.csv'), headers, rows)
    return len(rows)


def write_kompleksler(data):
    """Kompleksleri CSV'ye yazar."""
    headers = ['kompleksId', 'kompleksAdi', 'ilce', 'adres', 'acilisSaati', 'kapanisSaati']
    rows = []
    for k in data:
        rows.append([
            k.get('kompleksId', ''),
            k.get('kompleksAdi', ''),
            k.get('ilce', ''),
            k.get('adres', ''),
            k.get('acilisSaati', ''),
            k.get('kapanisSaati', '')
        ])
    write_csv(os.path.join(DATA_DIR, 'kompleksler.csv'), headers, rows)
    return len(rows)


def write_tesisler(data):
    """Tesisleri CSV'ye yazar."""
    headers = ['tesisId', 'kompleksId', 'tesisAdi', 'tesisTuru', 'kapasite', 'ucretSaatlik', 'durum', 'gorselUrl']
    rows = []
    for t in data:
        durum = 'Aktif' if t.get('status') == 'active' else 'Bakimda'
        rows.append([
            t.get('tesisId', ''),
            t.get('kompleksId', ''),
            t.get('name', t.get('tesisAdi', '')),
            t.get('sport', t.get('tesisTuru', '')),
            t.get('capacity', t.get('kapasite', 0)),
            t.get('price', t.get('ucretSaatlik', 0)),
            durum,
            t.get('image', '')
        ])
    write_csv(os.path.join(DATA_DIR, 'tesisler.csv'), headers, rows)
    return len(rows)


def write_rezervasyonlar(data):
    """Rezervasyon verilerini çifte rezervasyon kontrolü yaparak csv dosyasına yazar."""
    
    # Ağaç benzeri düğüm kilit tablosu (Çifte Rezervasyon Kontrolü)
    booked_nodes = {}
    existing_rows = []
    # Slot bazlı imza: tesis_tarih_saat (hangi kullanıcı olursa olsun)
    existing_slot_signatures = set()
    # Kullanıcı+slot bazlı imza: kullanici_tesis_tarih_saat
    existing_user_signatures = set()
    
    # MEVCUT CSV'yi okuyup dolu düğümleri işaretle ve eski kayıtları sakla
    existing_file = os.path.join(DATA_DIR, 'rezervasyonlar.csv')
    if os.path.exists(existing_file):
        try:
            with open(existing_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                if len(lines) > 1:
                    for line in lines[1:]:
                        parts = line.strip().split(',')
                        if len(parts) >= 7:
                            existing_rows.append(parts)
                            c_tesis = parts[1].strip()
                            c_kullanici = parts[2].strip()
                            c_tarih = parts[3].strip()
                            c_saat = parts[4].strip()
                            c_durum = parts[6].strip()
                            
                            # Kullanıcı bazlı imza
                            existing_user_signatures.add(f"{c_kullanici}_{c_tesis}_{c_tarih}_{c_saat}")
                            # Slot bazlı imza (tüm durumlar dahil)
                            existing_slot_signatures.add(f"{c_tesis}_{c_tarih}_{c_saat}_{c_durum}")
                            
                            if c_durum == 'Onaylandi':
                                booked_nodes[f"{c_tesis}_{c_tarih}_{c_saat}"] = True
        except Exception as e:
            print(f"[ERR] Mevcut rezervasyonlar okunamadı: {e}")

    print(f"[DEBUG] Mevcut CSV satır sayısı: {len(existing_rows)}")
    print(f"[DEBUG] Dolu düğümler (booked_nodes): {booked_nodes}")
    print(f"[DEBUG] Gelen veri sayısı: {len(data)}")

    is_single_new_record = (len(data) == 1 and str(data[0].get('id', '')).startswith('RES-') and not str(data[0].get('id', '')).startswith('RES-CSV-'))

    if not is_single_new_record:
        # Full sync: Keep only the rows that still exist in the incoming data
        valid_csv_ids = set()
        for r in data:
            rid = str(r.get('id', ''))
            if rid.startswith('RES-CSV-'):
                valid_csv_ids.add(rid.replace('RES-CSV-', ''))
            else:
                valid_csv_ids.add(rid)
        
        # Filtrele ve silinenleri listeden cikar
        original_count = len(existing_rows)
        existing_rows = [row for row in existing_rows if row[0] in valid_csv_ids]
        print(f"[DEBUG] Silinen kayit sayisi: {original_count - len(existing_rows)}")

    # Sadece YENİ EKLENEN rezervasyonları mevcut CSV'nin sonuna ekleyeceğiz
    new_rows = []
    # Yeni ekleneceklerin ID'sini mevcut en büyük ID'den başlat
    next_id = len(existing_rows) + 1

    for r in data:
        durum_map = {'confirmed': 'Onaylandi', 'pending': 'Beklemede', 'cancelled': 'Iptal', 'archived': 'Arsivlendi'}
        durum = durum_map.get(r.get('status', ''), r.get('status', ''))
        
        fid = str(r.get('facilityId', ''))
        tesis_id = fid.replace('tesis-', '').replace('facility-', '')
        
        tarih = str(r.get('date', ''))
        saat = str(r.get('time', ''))
        res_id = str(r.get('id', ''))
        kullanici_id = str(r.get('userId', ''))

        user_sig = f"{kullanici_id}_{tesis_id}_{tarih}_{saat}"
        node_key = f"{tesis_id}_{tarih}_{saat}"

        print(f"[DEBUG] İşlenen kayıt: id={res_id}, tesis={tesis_id}, tarih={tarih}, saat={saat}, durum={durum}, kullanici={kullanici_id}")

        # Eğer rezervasyon zaten CSV'de varsa (ID'si mevcutlar arasında ise) veya RES-CSV- ile başlıyorsa DURUMU GÜNCELLE
        csv_rez_id = res_id.replace('RES-CSV-', '')
        is_existing = False
        for i, row in enumerate(existing_rows):
            if row[0] == csv_rez_id or row[0] == res_id:
                if row[6] != durum:
                    # EĞER DURUM 'Onaylandi' YAPILMAK İSTENİYORSA ÇAKIŞMA KONTROLÜ YAP!
                    if durum == 'Onaylandi':
                        if booked_nodes.get(node_key) == True:
                            print(f"[DEBUG]   -> GÜNCELLEME ÇAKIŞMASI! node_key={node_key} zaten dolu")
                            raise DoubleBookingError("Rezervasyon başka bir kişi tarafından yapılmıştır.")
                        else:
                            # Slotu kilitle
                            booked_nodes[node_key] = True
                    # EĞER eski durum 'Onaylandi' ise ve yeni durum başka bir şey ise kilidi kaldır
                    elif row[6] == 'Onaylandi':
                        if node_key in booked_nodes:
                            booked_nodes[node_key] = False
                    
                    print(f"[DEBUG]   -> Güncelleme: ID {row[0]} durumu '{row[6]}' -> '{durum}' oldu.")
                    existing_rows[i][6] = durum
                is_existing = True
                break
        if is_existing:
            continue
            
        # Sadece YENİ (RES-) kayıtlar için Replay ve Çakışma kontrolü yap
        if user_sig in existing_user_signatures:
            print(f"[DEBUG]   -> Replay (aynı kullanıcı+slot), ATLANDI")
            continue
            
        if durum == 'Onaylandi':
            # Yeni rezervasyon! Düğüm dolu mu?
            if booked_nodes.get(node_key) == True:
                print(f"[DEBUG]   -> ÇAKIŞMA! node_key={node_key} zaten dolu")
                if len(data) == 1:
                    raise DoubleBookingError("Rezervasyon başka bir kişi tarafından yapılmıştır.")
                else:
                    print(f"[DEBUG]   -> Batch işleminde atlandı.")
                    continue
            else:
                booked_nodes[node_key] = True
                print(f"[DEBUG]   -> Düğüm kilitlendi: {node_key}")

        new_rows.append([
            res_id,
            tesis_id,
            kullanici_id,
            tarih,
            saat,
            str(r.get('duration', '1')) + ' Saat',
            durum
        ])
        existing_user_signatures.add(user_sig)
        print(f"[DEBUG]   -> YENİ KAYIT eklendi (id={res_id})")

    # Mevcut satırlar ile yeni satırları birleştir
    all_rows = existing_rows + new_rows

    headers = ['rezervasyonId', 'tesisId', 'kullaniciId', 'tarih', 'saat', 'sure', 'durum']
    write_csv(os.path.join(DATA_DIR, 'rezervasyonlar.csv'), headers, all_rows)
    print(f"[DEBUG] Toplam yazılan: {len(all_rows)} satır ({len(new_rows)} yeni)")
    return len(all_rows)


def write_degerlendirmeler(data):
    """Değerlendirmeleri CSV'ye yazar."""
    headers = ['degerlendirmeId', 'kullaniciId', 'kompleksId', 'puan', 'yorum', 'tarih']
    rows = []
    for d in data:
        rows.append([
            d.get('degerlendirmeId', ''),
            d.get('kullaniciId', ''),
            d.get('kompleksId', ''),
            d.get('puan', ''),
            d.get('yorum', ''),
            d.get('tarih', '')
        ])
    write_csv(os.path.join(DATA_DIR, 'degerlendirmeler.csv'), headers, rows)
    return len(rows)


def write_csv(filepath, headers, rows):
    """Genel CSV yazma fonksiyonu."""
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        f.write(','.join(headers) + '\n')
        for row in rows:
            # Virgül içeren değerleri tırnak içine al
            cleaned = []
            for val in row:
                s = str(val)
                if ',' in s:
                    s = '"' + s.replace('"', '""') + '"'
                cleaned.append(s)
            f.write(','.join(cleaned) + '\n')


# ==============================
# HTTP SUNUCUSU
# ==============================

class SyncHandler(http.server.SimpleHTTPRequestHandler):
    """Statik dosyalar + /api/sync endpoint'i."""

    def send_header(self, keyword, value):
        if keyword.lower() == 'content-type':
            if 'charset' not in value.lower():
                if value.startswith('text/') or 'javascript' in value or 'json' in value:
                    value = value + '; charset=utf-8'
        super().send_header(keyword, value)

    def do_OPTIONS(self):
        """CORS preflight."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/sync':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            stats = {}
            for f in ['kullanicilar.csv', 'kompleksler.csv', 'tesisler.csv', 'rezervasyonlar.csv', 'degerlendirmeler.csv']:
                p = os.path.join(DATA_DIR, f)
                if os.path.exists(p):
                    with open(p, 'r', encoding='utf-8') as file:
                        stats[f] = max(0, len(file.readlines()) - 1)
                else:
                    stats[f] = 0
            response = json.dumps({'success': True, 'status': 'running', 'records': stats})
            self.wfile.write(response.encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path

        if path == '/api/sync':
            self.handle_sync()
        elif path == '/api/upload':
            self.handle_upload()
        else:
            self.send_error(404, 'Endpoint bulunamadı')

    def handle_upload(self):
        """Base64 formatında gelen görseli dosyaya kaydeder."""
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            payload = json.loads(body)
            
            import base64
            import time
            
            filename = payload.get('filename', 'upload.jpg')
            filename = "".join(c for c in filename if c.isalnum() or c in "._- ")
            b64_data = payload.get('base64', '')
            
            if ',' in b64_data:
                b64_data = b64_data.split(',', 1)[1]
            
            file_data = base64.b64decode(b64_data)
            
            images_dir = os.path.join(DATA_DIR, 'images')
            if not os.path.exists(images_dir):
                os.makedirs(images_dir)
            
            unique_name = str(int(time.time())) + "_" + filename
            file_path = os.path.join(images_dir, unique_name)
            
            with open(file_path, 'wb') as f:
                f.write(file_data)
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = json.dumps({'success': True, 'url': '/data/images/' + unique_name})
            self.wfile.write(response.encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))

    def handle_sync(self):
        """localStorage verilerini CSV dosyalarına yazar."""
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            payload = json.loads(body)

            results = {}

            if 'kullanicilar' in payload:
                n = write_kullanicilar(payload['kullanicilar'])
                results['kullanicilar'] = f'{n} kayıt yazıldı'

            if 'kompleksler' in payload:
                n = write_kompleksler(payload['kompleksler'])
                results['kompleksler'] = f'{n} kayıt yazıldı'

            if 'tesisler' in payload:
                n = write_tesisler(payload['tesisler'])
                results['tesisler'] = f'{n} kayıt yazıldı'

            if 'rezervasyonlar' in payload:
                n = write_rezervasyonlar(payload['rezervasyonlar'])
                results['rezervasyonlar'] = f'{n} kayıt yazıldı'

            if 'degerlendirmeler' in payload:
                n = write_degerlendirmeler(payload['degerlendirmeler'])
                results['degerlendirmeler'] = f'{n} kayıt yazıldı'

            response = json.dumps({
                'success': True,
                'message': 'CSV dosyaları güncellendi',
                'details': results
            }, ensure_ascii=False)

            print(f'[OK] Sync tamamlandi: {results}')

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response.encode('utf-8'))

        except DoubleBookingError as e:
            # Ağaç düğüm çakışması (Çifte Rezervasyon) hatası
            print(f"[!] Çarpışma (Double-Booking) Engellendi: {str(e)}")
            self.send_response(409)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = json.dumps({
                'success': False,
                'message': str(e),
                'errorType': 'DOUBLE_BOOKING'
            }, ensure_ascii=False)
            self.wfile.write(response.encode('utf-8'))

        except Exception as e:
            error_msg = json.dumps({
                'success': False,
                'message': str(e)
            }, ensure_ascii=False)

            print(f'[ERR] Sync hatasi: {e}')

            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(error_msg.encode('utf-8'))

    def log_message(self, format, *args):
        """Sadece API isteklerini logla, statik dosyaları sessiz geç."""
        if '/api/' in str(args[0]):
            print(f'[REQ] {args[0]}')


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    print('=' * 55)
    print('  TEKİRDAĞ SPOR REZERVASYON — Sync Server')
    print('=' * 55)
    print(f'  [>] Proje dizini: {os.getcwd()}')
    print(f'  [>] CSV dizini:   {DATA_DIR}')
    print(f'  [>] Adres:        http://localhost:{PORT}')
    print(f'  [>] Ana sayfa:    http://localhost:{PORT}/index.html')
    print('=' * 55)
    print('  Sunucu çalışıyor... Durdurmak için Ctrl+C\n')

    server = http.server.HTTPServer(('', PORT), SyncHandler)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n[X] Sunucu kapatildi.')
        server.server_close()


if __name__ == '__main__':
    main()
