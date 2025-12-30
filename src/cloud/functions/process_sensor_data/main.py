import base64
import json
import os
from supabase import create_client, Client
from datetime import datetime

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

def process_sensor_data(event, context):
    """
    Triggered by Pub/Sub message from GCP IoT Core.
    Processes sensor data and stores in Supabase.
    """
    
    try:
        # Decode Pub/Sub message
        pubsub_message = base64.b64decode(event['data']).decode('utf-8')
        data = json.loads(pubsub_message)
        
        print(f"Received data: {data}")
        
        # Insert into Supabase sensor_readings table
        result = supabase.table('sensor_readings').insert({
            'device_id': data.get('device_id', 'esp32-001'),
            'temperature': float(data.get('temperature', 0)),
            'ph': float(data.get('ph', 0)),
            'dissolved_oxygen': float(data.get('dissolved_oxygen', 0)),
            'ammonia': float(data.get('ammonia', 0)),
            'salinity': float(data.get('salinity', 0))
        }).execute()
        
        print(f"Data inserted successfully: {result}")
        
        # Check thresholds and create alerts if needed
        alerts = check_thresholds(data)
        if alerts:
            print(f"Alerts created: {len(alerts)}")
        
        return 'OK', 200
    
    except Exception as e:
        print(f"Error processing sensor data: {str(e)}")
        import traceback
        traceback.print_exc()
        return f'Error: {str(e)}', 500


def check_thresholds(data):
    """
    Check if sensor values exceed thresholds for Asian Seabass.
    Create alerts in Supabase if thresholds are breached.
    """
    # Thresholds for Asian Seabass (from research paper)
    thresholds = {
        'temperature': (26, 32),      # °C
        'ph': (7.0, 8.5),             # pH units
        'dissolved_oxygen': (4.0, 8.0), # mg/L
        'ammonia': (0, 0.02),         # ppm
        'salinity': (28, 32)          # ppt
    }
    
    device_id = data.get('device_id', 'esp32-001')
    alerts_created = []
    
    for param, (min_val, max_val) in thresholds.items():
        value = data.get(param)
        
        if value is None:
            continue
            
        try:
            value = float(value)
        except (ValueError, TypeError):
            print(f"Invalid value for {param}: {value}")
            continue
        
        # Check if value is out of range
        if value < min_val or value > max_val:
            # Determine severity
            if param in ['dissolved_oxygen', 'ammonia']:
                severity = 'high'  # Critical parameters
            elif abs(value - min_val) > (max_val - min_val) * 0.5 or \
                 abs(value - max_val) > (max_val - min_val) * 0.5:
                severity = 'medium'
            else:
                severity = 'low'
            
            # Create alert in Supabase
            try:
                alert_result = supabase.table('alerts').insert({
                    'device_id': device_id,
                    'parameter': param,
                    'value': value,
                    'threshold_min': min_val,
                    'threshold_max': max_val,
                    'severity': severity
                }).execute()
                
                alerts_created.append(alert_result)
                print(f"⚠️ Alert: {param} = {value} (threshold: {min_val}-{max_val}, severity: {severity})")
                
            except Exception as e:
                print(f"Error creating alert for {param}: {str(e)}")
    
    return alerts_created
