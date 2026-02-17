#!/usr/bin/env python3
"""
Yangın Tespit Scripti
Roboflow API kullanarak görüntüde yangın tespiti yapar.
"""

import sys
import json
import os
from pathlib import Path

# Ultralytics'in info mesajlarını stderr'e yönlendir
import warnings
warnings.filterwarnings('ignore')

# Roboflow API ayarları
USE_ROBOFLOW_API = os.getenv('USE_ROBOFLOW_API', 'true').lower() == 'true'
ROBOFLOW_API_KEY = os.getenv('ROBOFLOW_API_KEY', '1hiCMEo32b7WdVqwKGV8')
ROBOFLOW_MODEL_ID = os.getenv('ROBOFLOW_MODEL_ID', 'fire-detection-n4dzj/1')

# Roboflow Inference SDK import
ROBOFLOW_AVAILABLE = False
try:
    if USE_ROBOFLOW_API:
        from inference_sdk import InferenceHTTPClient
        ROBOFLOW_AVAILABLE = True
except ImportError:
    ROBOFLOW_AVAILABLE = False
    print(json.dumps({
        "fireDetected": False,
        "confidence": 0.0,
        "error": "inference-sdk kütüphanesi bulunamadı. 'pip install inference-sdk' komutuyla yükleyin."
    }), file=sys.stderr)


def detect_fire_roboflow_api(image_path: str) -> dict:
    """
    Roboflow API kullanarak yangın tespiti yapar.
    
    Args:
        image_path: Analiz edilecek görüntü dosyasının yolu
        
    Returns:
        JSON formatında sonuç: {"fireDetected": bool, "confidence": float}
    """
    try:
        client = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=ROBOFLOW_API_KEY
        )
        
        # Görüntüyü analiz et
        result = client.infer(image_path, model_id=ROBOFLOW_MODEL_ID)
        
        fire_detected = False
        max_confidence = 0.0
        detected_objects = []
        no_fire_confidence = 0.95  # Yangın olmadığına dair varsayılan güven seviyesi
        
        # Roboflow API sonucunu parse et
        # NOT: Bu bir fire detection modeli olduğu için,
        # herhangi bir prediction varsa yangın tespit edilmiş demektir
        if 'predictions' in result and len(result['predictions']) > 0:
            for prediction in result['predictions']:
                class_name = str(prediction.get('class', '')).lower()
                class_id = prediction.get('class_id', -1)
                confidence = float(prediction.get('confidence', 0))
                
                detected_objects.append({
                    "class": class_name,
                    "class_id": class_id,
                    "confidence": round(confidence, 4)
                })
                
                # Fire detection modelinde herhangi bir prediction yangın demektir
                # Class değeri "0", "fire", veya herhangi bir değer olabilir
                # Confidence threshold: 0.5 (50%)
                if confidence > 0.5:
                    fire_detected = True
                    max_confidence = max(max_confidence, confidence)
                else:
                    # Düşük confidence'li prediction varsa, yangın olmadığına dair güven artar
                    # En yüksek confidence'in tersi olarak kullanılabilir
                    no_fire_confidence = max(no_fire_confidence, 1.0 - confidence)
        else:
            # Hiç prediction yoksa, yangın olmadığına dair yüksek güven
            no_fire_confidence = 0.95
        
        # Güven seviyesini hesapla
        if fire_detected:
            final_confidence = round(max_confidence, 4)
        else:
            # Yangın tespit edilmediyse, yangın olmadığına dair güven seviyesi
            final_confidence = round(no_fire_confidence, 4)
        
        return {
            "fireDetected": fire_detected,
            "confidence": final_confidence,
            "detectedObjects": detected_objects[:10],
            "modelType": "Roboflow API (Fire Detection)"
        }
        
    except Exception as e:
        return {
            "fireDetected": False,
            "confidence": 0.0,
            "error": f"Roboflow API hatası: {str(e)}"
        }


def detect_fire(image_path: str) -> dict:
    """
    Görüntüde yangın tespiti yapar.
    Önce Roboflow API'yi dener, başarısız olursa yerel modeli kullanır.
    
    Args:
        image_path: Analiz edilecek görüntü dosyasının yolu
        
    Returns:
        JSON formatında sonuç: {"fireDetected": bool, "confidence": float}
    """
    try:
        # Dosya varlığını kontrol et
        if not os.path.exists(image_path):
            return {
                "fireDetected": False,
                "confidence": 0.0,
                "error": f"Dosya bulunamadı: {image_path}"
            }
        
        # Roboflow API kullan
        if USE_ROBOFLOW_API and ROBOFLOW_AVAILABLE:
            return detect_fire_roboflow_api(image_path)
        else:
            # Fallback: Yerel model (şimdilik desteklenmiyor - API kullanın)
            return {
                "fireDetected": False,
                "confidence": 0.0,
                "error": "Roboflow API kullanılamıyor. 'pip install inference-sdk' komutunu çalıştırın."
            }
        
    except Exception as e:
        return {
            "fireDetected": False,
            "confidence": 0.0,
            "error": str(e)
        }


if __name__ == "__main__":
    # Komut satırı argümanı olarak görüntü yolu al
    if len(sys.argv) < 2:
        print(json.dumps({
            "fireDetected": False,
            "confidence": 0.0,
            "error": "Kullanım: python detect_fire.py <görüntü_yolu>"
        }))
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = detect_fire(image_path)
    
    # JSON formatında yazdır
    print(json.dumps(result, ensure_ascii=False))
