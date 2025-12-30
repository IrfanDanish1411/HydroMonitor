# MQTT Broker Setup Guide (GCP VM + Mosquitto)

This guide shows how to set up an MQTT broker on a GCP VM for your IoT water quality monitoring system.

## Why MQTT Broker Instead of IoT Core?

**Advantages:**
- ✅ **Simpler**: No device registries, no JWT authentication
- ✅ **Cheaper**: GCP e2-micro VM is FREE (free tier)
- ✅ **Easier ESP32 code**: Standard MQTT library
- ✅ **Direct control**: You manage everything
- ✅ **Perfect for students**: 1-10 devices

**Architecture:**
```
ESP32 → MQTT Broker (Mosquitto) → Python Bridge → Supabase → PWA
```

---

## Part 1: Create GCP VM with MQTT Broker

### Step 1: Create VM Instance (5 minutes)

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Create e2-micro VM (FREE TIER)
gcloud compute instances create mqtt-broker \
    --zone=asia-southeast1-a \
    --machine-type=e2-micro \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=10GB \
    --boot-disk-type=pd-standard \
    --tags=mqtt-server \
    --metadata=startup-script='#!/bin/bash
apt-get update
apt-get install -y mosquitto mosquitto-clients python3-pip
systemctl enable mosquitto
systemctl start mosquitto'

# Allow MQTT port (1883)
gcloud compute firewall-rules create allow-mqtt \
    --allow=tcp:1883 \
    --target-tags=mqtt-server \
    --description="Allow MQTT traffic"

# Get VM external IP
gcloud compute instances describe mqtt-broker \
    --zone=asia-southeast1-a \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

**Save the external IP** - you'll need it for ESP32!

### Step 2: Configure Mosquitto (5 minutes)

```bash
# SSH into VM
gcloud compute ssh mqtt-broker --zone=asia-southeast1-a

# Create Mosquitto config
sudo nano /etc/mosquitto/conf.d/default.conf
```

Add this configuration:

```conf
# Allow anonymous connections (for testing)
# For production, add username/password authentication
allow_anonymous true

# Listen on all interfaces
listener 1883 0.0.0.0

# Logging
log_dest file /var/log/mosquitto/mosquitto.log
log_type all

# Persistence
persistence true
persistence_location /var/lib/mosquitto/
```

Save and exit (Ctrl+X, Y, Enter)

```bash
# Restart Mosquitto
sudo systemctl restart mosquitto

# Check status
sudo systemctl status mosquitto

# Test MQTT broker
mosquitto_sub -h localhost -t test &
mosquitto_pub -h localhost -t test -m "Hello MQTT"
```

You should see "Hello MQTT" printed!

---

## Part 2: Create Python Bridge Script

This script subscribes to MQTT and forwards data to Supabase.

### Step 1: Install Dependencies

```bash
# Still in VM SSH session
sudo pip3 install paho-mqtt supabase python-dotenv
```

### Step 2: Create Bridge Script

```bash
# Create directory
mkdir ~/mqtt-bridge
cd ~/mqtt-bridge

# Create environment file
nano .env
```

Add your Supabase credentials:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-service-role-key-here
```

Save and exit.

```bash
# Create Python script
nano mqtt_to_supabase.py
```

Paste this code:

```python
#!/usr/bin/env python3
import paho.mqtt.client as mqtt
from supabase import create_client, Client
import json
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Supabase setup
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Thresholds for Asian Seabass
THRESHOLDS = {
    'temperature': (26, 32),
    'ph': (7.0, 8.5),
    'dissolved_oxygen': (4.0, 8.0),
    'ammonia': (0, 0.02),
    'salinity': (28, 32)
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
            severity = 'high' if param in ['dissolved_oxygen', 'ammonia'] else 'medium'
            
            try:
                supabase.table('alerts').insert({
                    'device_id': device_id,
                    'parameter': param,
                    'value': value,
                    'threshold_min': min_val,
                    'threshold_max': max_val,
                    'severity': severity
                }).execute()
                
                print(f"⚠️  Alert: {param} = {value} (threshold: {min_val}-{max_val})")
            except Exception as e:
                print(f"Error creating alert: {e}")

def on_connect(client, userdata, flags, rc):
    """Callback when connected to MQTT broker"""
    if rc == 0:
        print("✅ Connected to MQTT broker")
        client.subscribe("water-quality/sensor-data")
        print("📡 Subscribed to: water-quality/sensor-data")
    else:
        print(f"❌ Connection failed with code {rc}")

def on_message(client, userdata, msg):
    """Callback when MQTT message received"""
    try:
        # Decode message
        payload = msg.payload.decode('utf-8')
        data = json.loads(payload)
        
        print(f"\n📨 Received: {data}")
        
        # Insert into Supabase
        result = supabase.table('sensor_readings').insert({
            'device_id': data.get('device_id', 'esp32-001'),
            'temperature': float(data.get('temperature', 0)),
            'ph': float(data.get('ph', 0)),
            'dissolved_oxygen': float(data.get('dissolved_oxygen', 0)),
            'ammonia': float(data.get('ammonia', 0)),
            'salinity': float(data.get('salinity', 0))
        }).execute()
        
        print(f"✅ Saved to Supabase: ID {result.data[0]['id']}")
        
        # Check thresholds
        check_thresholds(data)
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

def on_disconnect(client, userdata, rc):
    """Callback when disconnected"""
    if rc != 0:
        print(f"⚠️  Unexpected disconnect. Reconnecting...")

# Create MQTT client
client = mqtt.Client(client_id="mqtt-supabase-bridge")
client.on_connect = on_connect
client.on_message = on_message
client.on_disconnect = on_disconnect

# Connect to MQTT broker
print("🔌 Connecting to MQTT broker...")
client.connect("localhost", 1883, 60)

# Start loop
print("🔄 Starting MQTT loop...")
client.loop_forever()
```

Save and exit.

### Step 3: Run Bridge Script

```bash
# Make executable
chmod +x mqtt_to_supabase.py

# Test run
python3 mqtt_to_supabase.py
```

You should see:
```
✅ Connected to MQTT broker
📡 Subscribed to: water-quality/sensor-data
🔄 Starting MQTT loop...
```

Keep this running! Open a new SSH session for testing.

---

## Part 3: Test the System

### Test from VM

Open a new SSH session:

```bash
gcloud compute ssh mqtt-broker --zone=asia-southeast1-a

# Publish test message
mosquitto_pub -h localhost -t water-quality/sensor-data -m '{
  "device_id": "esp32-001",
  "temperature": 28.5,
  "ph": 7.8,
  "dissolved_oxygen": 6.2,
  "ammonia": 0.01,
  "salinity": 30.1
}'
```

In the bridge script terminal, you should see:
```
📨 Received: {'device_id': 'esp32-001', ...}
✅ Saved to Supabase: ID 1
```

### Verify in Supabase

1. Go to Supabase → Table Editor
2. Open `sensor_readings` table
3. **You should see the test data!** 🎉

---

## Part 4: Run Bridge Script as Service

Make the bridge script run automatically on VM startup:

```bash
# Create systemd service
sudo nano /etc/systemd/system/mqtt-bridge.service
```

Paste this:

```ini
[Unit]
Description=MQTT to Supabase Bridge
After=network.target mosquitto.service

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/mqtt-bridge
ExecStart=/usr/bin/python3 /home/YOUR_USERNAME/mqtt-bridge/mqtt_to_supabase.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Replace `YOUR_USERNAME` with your actual username (run `whoami` to check).

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable mqtt-bridge
sudo systemctl start mqtt-bridge

# Check status
sudo systemctl status mqtt-bridge

# View logs
sudo journalctl -u mqtt-bridge -f
```

---

## Part 5: ESP32 Configuration

Your ESP32 code becomes much simpler!

### Install Library

In Arduino IDE:
- Go to Sketch → Include Library → Manage Libraries
- Search for "PubSubClient"
- Install "PubSubClient by Nick O'Leary"

### Get VM IP Address

```bash
gcloud compute instances describe mqtt-broker \
    --zone=asia-southeast1-a \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

Save this IP - you'll use it in ESP32 code!

### ESP32 Code Example

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT broker (your GCP VM external IP)
const char* mqtt_server = "XX.XX.XX.XX";  // Replace with your VM IP
const int mqtt_port = 1883;
const char* mqtt_topic = "water-quality/sensor-data";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected");
  
  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP32Client")) {
      Serial.println("✅ Connected");
    } else {
      Serial.print("❌ Failed, rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Read sensors (placeholder values)
  float temp = 28.5;  // Replace with actual sensor reading
  float ph = 7.8;
  float DO = 6.2;
  float ammonia = 0.01;
  float salinity = 30.1;
  
  // Create JSON
  StaticJsonDocument<256> doc;
  doc["device_id"] = "esp32-001";
  doc["temperature"] = temp;
  doc["ph"] = ph;
  doc["dissolved_oxygen"] = DO;
  doc["ammonia"] = ammonia;
  doc["salinity"] = salinity;
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  // Publish to MQTT
  if (client.publish(mqtt_topic, buffer)) {
    Serial.println("✅ Data published");
  } else {
    Serial.println("❌ Publish failed");
  }
  
  delay(21600000); // 6 hours
}
```

---

## Summary

**What You Have Now:**
- ✅ GCP VM with Mosquitto MQTT broker (FREE)
- ✅ Python bridge forwarding MQTT → Supabase
- ✅ Auto-start service (runs on VM boot)
- ✅ Simple ESP32 code (standard MQTT)
- ✅ Real-time data in Supabase
- ✅ **Total cost: $0/month!**

**Next Steps:**
1. Build the React PWA (Part 3 of SUPABASE_PWA_SETUP.md)
2. Connect actual sensors to ESP32
3. Deploy everything!

**Advantages Over IoT Core:**
- ✅ 80% simpler setup
- ✅ 100% cheaper ($0 vs $0.80/month)
- ✅ Easier to debug
- ✅ Standard MQTT protocol
- ✅ Full control

You're all set! 🚀
