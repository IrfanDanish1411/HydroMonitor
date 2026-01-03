#!/usr/bin/env python3
import paho.mqtt.client as mqtt
from supabase import create_client, Client
import json
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Import email notifier (optional - gracefully handles if not configured)
from email_notifier import send_alert_email

# Supabase setup
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Default Thresholds (fallback if Supabase not available)
DEFAULT_THRESHOLDS = {
    'temperature': (26.0, 32.0),
    'ph': (6.0, 9.0),
    'dissolved_oxygen': (4.0, 8.0),
    'ammonia': (0.0, 2.0),
    'salinity': (28.0, 32.0)
}

# Cache for thresholds
_cached_thresholds = None
_cache_time = 0

def get_thresholds():
    """Fetch thresholds from Supabase dashboard settings, with caching."""
    global _cached_thresholds, _cache_time
    import time
    
    # Cache for 30 seconds to avoid too many DB calls
    if _cached_thresholds and (time.time() - _cache_time) < 30:
        return _cached_thresholds
    
    try:
        result = supabase.table('threshold_settings').select('*').limit(1).execute()
        if result.data and len(result.data) > 0:
            s = result.data[0]
            _cached_thresholds = {
                'temperature': (s.get('temperature_min', 26), s.get('temperature_max', 32)),
                'ph': (s.get('ph_min', 6), s.get('ph_max', 9)),
                'dissolved_oxygen': (s.get('dissolved_oxygen_min', 4), s.get('dissolved_oxygen_max', 8)),
                'ammonia': (s.get('ammonia_min', 0), s.get('ammonia_max', 2)),
                'salinity': (28.0, 32.0)  # Keep default for salinity
            }
            _cache_time = time.time()
            print(f"[THRESHOLDS] Loaded from dashboard: T={_cached_thresholds['temperature']}, pH={_cached_thresholds['ph']}, NH3={_cached_thresholds['ammonia']}")
            return _cached_thresholds
    except Exception as e:
        print(f"[THRESHOLDS] Using defaults (DB error: {type(e).__name__})")
    
    return DEFAULT_THRESHOLDS

def check_thresholds(data):
    """Check if values exceed thresholds and create alerts"""
    device_id = data.get('device_id', 'esp32-001')
    thresholds = get_thresholds()  # Fetch from Supabase or use defaults
    
    for param, (min_val, max_val) in thresholds.items():
        value = data.get(param)
        if value is None:
            continue
            
        try:
            value = float(value)
        except (ValueError, TypeError):
            continue
        
        if value < min_val or value > max_val:
            is_critical = param in ['ammonia', 'ph', 'temperature']
            severity = 'high' if is_critical else 'medium'
            
            try:
                supabase.table('alerts').insert({
                    'device_id': device_id,
                    'parameter': param,
                    'value': value,
                    'threshold_min': min_val,
                    'threshold_max': max_val,
                    'severity': severity
                }).execute()
                
                print(f"[ALERT] {param} = {value} (Limits: {min_val}-{max_val}) | Severity: {severity.upper()}")
                
                # Send email notification
                send_alert_email(param, value, min_val, max_val, severity, device_id)
                
            except Exception as e:
                print(f"[ERROR] Creating alert: {e}")

def on_connect(client, userdata, flags, rc):
    """Callback when connected to MQTT broker"""
    if rc == 0:
        print("\n" + "="*40)
        print("✅ MQTT BRIDGE CONNECTED")
        print(f"🕒 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*40)
        client.subscribe("water-quality/sensor-data")
        print("📡 Subscribing to: water-quality/sensor-data")
    else:
        print(f"❌ Connection failed with code {rc}")

def on_message(client, userdata, msg):
    """Callback when MQTT message received"""
    try:
        # Decode and Parse JSON
        payload = msg.payload.decode('utf-8')
        data = json.loads(payload)
        
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"\n[{timestamp}] 📨 New Data Received from {data.get('device_id')}")
        print(f"   📊 T: {data.get('temperature')}°C | pH: {data.get('ph')} | NH3: {data.get('ammonia')} ppm")
        
        # Save to sensor_readings table
        result = supabase.table('sensor_readings').insert({
            'device_id': data.get('device_id', 'esp32-001'),
            'temperature': float(data.get('temperature', 0)),
            'ph': float(data.get('ph', 0)),
            'dissolved_oxygen': float(data.get('dissolved_oxygen', 0)),
            'ammonia': float(data.get('ammonia', 0)),
            'salinity': float(data.get('salinity', 0))
        }).execute()
        
        if result.data:
            print(f"   ✅ Saved to Database (ID: {result.data[0]['id']})")
        
        # Run Threshold Analysis
        check_thresholds(data)
        
    except json.JSONDecodeError:
        print(f"❌ Error: Received malformed JSON payload")
    except Exception as e:
        print(f"❌ error processing message: {e}")

def on_disconnect(client, userdata, rc):
    """Callback when disconnected"""
    if rc != 0:
        print(f"⚠️  MQTT Connection Lost. Attempting to reconnect...")

# Create and Start MQTT Client
client = mqtt.Client(client_id="mqtt-supabase-bridge")
client.on_connect = on_connect
client.on_message = on_message
client.on_disconnect = on_disconnect

print("🔌 Initiating link to MQTT broker...")
client.connect("localhost", 1883, 60)

print("🔄 Listening for sensor updates in Automated Mode...")
client.loop_forever()

