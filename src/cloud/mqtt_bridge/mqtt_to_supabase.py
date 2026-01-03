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

# Thresholds for Asian Seabass (Synced with ESP32 Automated Mode)
THRESHOLDS = {
    'temperature': (26.0, 32.0),
    'ph': (6.0, 9.0),
    'dissolved_oxygen': (4.0, 8.0),
    'ammonia': (0.0, 2.0),
    'salinity': (28.0, 32.0)
}

def check_thresholds(data):
    """Check if values exceed thresholds and create alerts"""
    device_id = data.get('device_id', 'esp32-001')
    
    for param, (min_val, max_val) in THRESHOLDS.items():
        value = data.get(param)
        if value is None:
            continue
            
        try:
            value = float(value)
        except (ValueError, TypeError):
            continue
        
        if value < min_val or value > max_val:
            # Critical parameters for immediate action
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
                
                print(f"⚠️  ALERT TRIGGERED: {param} = {value} (Limits: {min_val}-{max_val}) | Severity: {severity.upper()}")
                
                # Send email notification
                send_alert_email(param, value, min_val, max_val, severity, device_id)
                
            except Exception as e:
                print(f"❌ Error creating alert: {e}")

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

