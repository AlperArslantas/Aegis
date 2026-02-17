#!/usr/bin/env python3
"""
Yangın Tespit Modeli İndirme Scripti
Roboflow veya Hugging Face'den özel yangın tespit modeli indirir.
"""

import os
import sys
import json
from pathlib import Path
import urllib.request
import shutil

def download_from_github():
    """
    GitHub'dan önceden eğitilmiş yangın tespit modeli indir
    """
    print("📥 GitHub'dan yangın tespit modeli indiriliyor...")
    
    # Popüler yangın tespit modelleri
    # Not: Bu URL'ler örnek - gerçek model URL'lerini güncellemeniz gerekebilir
    model_urls = [
        # Örnek: Roboflow Fire Detection (gerçek URL'i güncelleyin)
        "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt",  # Fallback
    ]
    
    script_dir = Path(__file__).parent
    model_path = script_dir / 'fire_detection_model.pt'
    
    print("⚠️  Otomatik indirme şu anda mevcut değil.")
    print("Lütfen manuel olarak model indirin:")
    print("\n1. Roboflow: https://roboflow.com/models/fire-detection")
    print("2. Hugging Face: https://huggingface.co/models?search=fire+detection")
    print("3. Kendi modelinizi eğitin")
    print(f"\nModel dosyasını şuraya koyun: {model_path}")
    
    return False

def download_from_roboflow():
    """
    Roboflow'dan model indirme (API key gerekli)
    """
    print("📥 Roboflow'dan yangın tespit modeli indiriliyor...")
    print("⚠️  Roboflow API key gerekli. Manuel indirme önerilir.")
    print("\nManuel indirme adımları:")
    print("1. https://roboflow.com adresine gidin")
    print("2. 'Fire Detection' dataset'ini arayın")
    print("3. Model'i export edin (YOLOv8 format)")
    print("4. best.pt dosyasını fire_detection_model.pt olarak kaydedin")
    print("5. Bu script'in bulunduğu dizine kopyalayın")
    
    return False

def download_from_huggingface():
    """
    Hugging Face'den model indirme
    """
    print("📥 Hugging Face'den yangın tespit modeli indiriliyor...")
    
    try:
        from huggingface_hub import hf_hub_download
        
        # Hugging Face'de yangın tespit modelleri
        repo_id = "ultralytics/fire-detection"  # Örnek repo
        filename = "best.pt"
        
        script_dir = Path(__file__).parent
        model_path = script_dir / 'fire_detection_model.pt'
        
        print(f"Model indiriliyor: {repo_id}/{filename}")
        downloaded_path = hf_hub_download(
            repo_id=repo_id,
            filename=filename,
            local_dir=str(script_dir),
            local_dir_use_symlinks=False
        )
        
        # Dosyayı fire_detection_model.pt olarak kopyala
        if os.path.exists(downloaded_path):
            shutil.copy(downloaded_path, model_path)
            print(f"✅ Model başarıyla indirildi: {model_path}")
            return True
    except ImportError:
        print("⚠️  huggingface_hub kütüphanesi yüklü değil.")
        print("Yüklemek için: pip install huggingface_hub")
    except Exception as e:
        print(f"❌ İndirme hatası: {e}")
    
    return False

def main():
    print("=" * 60)
    print("🔥 YANGIN TESPİT MODELİ İNDİRME")
    print("=" * 60)
    print()
    
    script_dir = Path(__file__).parent
    model_path = script_dir / 'fire_detection_model.pt'
    
    # Model zaten varsa
    if model_path.exists():
        print(f"✅ Model zaten mevcut: {model_path}")
        response = input("Yeniden indirmek ister misiniz? (e/h): ")
        if response.lower() != 'e':
            print("İşlem iptal edildi.")
            return
        model_path.unlink()
    
    print("\nİndirme yöntemi seçin:")
    print("1. GitHub (Önerilen - Otomatik)")
    print("2. Hugging Face (huggingface_hub gerekli)")
    print("3. Roboflow (Manuel indirme önerilir)")
    print("4. Manuel (Kendi modelinizi kullanın)")
    
    choice = input("\nSeçiminiz (1-4): ").strip()
    
    success = False
    
    if choice == "1":
        success = download_from_github()
    elif choice == "2":
        success = download_from_huggingface()
    elif choice == "3":
        download_from_roboflow()
        print("\nManuel indirme tamamlandıktan sonra model dosyasını şuraya koyun:")
        print(f"{model_path}")
    elif choice == "4":
        print("\nKendi modelinizi şuraya koyun:")
        print(f"{model_path}")
        print("\nModel dosyası hazır olduğunda 'detect_fire.py' otomatik olarak kullanacaktır.")
        return
    else:
        print("❌ Geçersiz seçim!")
        return
    
    if success:
        print("\n" + "=" * 60)
        print("✅ MODEL BAŞARIYLA İNDİRİLDİ!")
        print("=" * 60)
        print(f"Model yolu: {model_path}")
        print("\nArtık 'detect_fire.py' özel yangın tespit modelini kullanacak.")
    else:
        print("\n" + "=" * 60)
        print("⚠️  OTOMATİK İNDİRME BAŞARISIZ")
        print("=" * 60)
        print("\nManuel indirme için:")
        print("1. https://roboflow.com veya https://huggingface.co adresine gidin")
        print("2. 'Fire Detection' veya 'Flame Detection' modeli arayın")
        print("3. Model'i YOLOv8 formatında export edin")
        print(f"4. best.pt dosyasını 'fire_detection_model.pt' olarak {script_dir} dizinine koyun")
        print("\nAlternatif: Kendi modelinizi eğitip kullanabilirsiniz.")

if __name__ == "__main__":
    main()
