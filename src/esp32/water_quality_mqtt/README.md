# ESP32 MQTT Water Monitoring - Quick Start Guide

## What Changed from Your Original Code

✅ **Added WiFi connectivity**
✅ **Added MQTT publishing to Mosquitto broker**
✅ **Added linear regression for accuracy (from research paper)**
✅ **Added JSON formatting for data**
✅ **Kept all your original sensor reading logic**
✅ **Kept pump control and button toggle**

## Required Libraries

Install these in Arduino IDE (Sketch → Include Library → Manage Libraries):

1. **PubSubClient** by Nick O'Leary (for MQTT)
2. **ArduinoJson** by Benoit Blanchon (for JSON)
3. **OneWire** (you already have this)
4. **DallasTemperature** (you already have this)

## Configuration Steps

### Step 1: Update WiFi Credentials

In the code, find these lines and replace with your WiFi:

```cpp
const char* ssid = "YOUR_WIFI_SSID";        // Your WiFi name
const char* password = "YOUR_WIFI_PASSWORD"; // Your WiFi password
```

### Step 2: Set MQTT Broker IP

Replace with your GCP VM external IP (from MQTT_BROKER_SETUP.md):

```cpp
const char* mqtt_server = "XX.XX.XX.XX";  // Your VM IP address
```

To get your VM IP:
```bash
gcloud compute instances describe mqtt-broker \
    --zone=asia-southeast1-a \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

### Step 3: Upload to ESP32

1. Open `water_quality_mqtt.ino` in Arduino IDE
2. Select **Board**: ESP32 Dev Module
3. Select **Port**: Your ESP32's COM port
4. Click **Upload**

## How It Works

### Local Operation (Every 1 second)
- Reads temperature, ammonia, pH
- Controls pump based on ammonia threshold
- Displays data on Serial Monitor

### MQTT Publishing (Every 6 hours)
- Applies linear regression for accuracy
- Creates JSON payload
- Publishes to MQTT broker
- Data flows to Supabase automatically

### Data Flow
```
ESP32 → MQTT Broker → Python Bridge → Supabase → PWA
```

## Testing

### 1. Monitor Serial Output

Open Serial Monitor (115200 baud):

```
========================================
 WATER MONITORING SYSTEM + MQTT 
========================================

>>> Connecting to WiFi...
✅ WiFi Connected!
IP Address: 192.168.1.100

>>> Connecting to MQTT broker... ✅ Connected!

========================================
System Ready!
========================================

TEMP: 28.5°C | NH3: 45.2ppm | pH: 7.8 | PUMP: OFF

>>> Publishing to MQTT...
{"device_id":"esp32-001","temperature":28.5,"ph":7.8,"dissolved_oxygen":6.5,"ammonia":0.045,"salinity":30.0}
✅ Data published successfully!
```

### 2. Verify in Supabase

1. Go to Supabase → Table Editor
2. Open `sensor_readings` table
3. You should see your ESP32 data!

## Adjusting Reading Interval

For testing, change to 1 minute instead of 6 hours:

```cpp
// Comment out this line:
// #define READING_INTERVAL 21600000  // 6 hours

// Uncomment this line:
#define READING_INTERVAL 60000  // 1 minute
```

For production, use 6 hours to save power and bandwidth.

## Adding Missing Sensors

You have placeholders for:
- **Dissolved Oxygen**: Currently set to 6.5 (line 129)
- **Salinity**: Currently set to 30.0 (line 131)

When you add these sensors:
1. Read the sensor value
2. Apply regression if available
3. Replace the hardcoded value in JSON

Example:
```cpp
float doValue = readDOSensor();  // Your DO sensor reading
float correctedDO = applyDORegression(doValue);
doc["dissolved_oxygen"] = correctedDO;
```

## Troubleshooting

### WiFi won't connect
- Check SSID and password are correct
- Ensure ESP32 is in range of WiFi
- Try 2.4GHz network (ESP32 doesn't support 5GHz)

### MQTT connection fails
- Verify VM IP address is correct
- Check firewall allows port 1883
- Ensure Mosquitto is running on VM

### Data not in Supabase
- Check Python bridge script is running on VM
- View bridge logs: `sudo journalctl -u mqtt-bridge -f`
- Verify Supabase credentials in bridge script

## Power Optimization (Optional)

For battery operation, add deep sleep:

```cpp
// After publishing to MQTT
esp_sleep_enable_timer_wakeup(READING_INTERVAL * 1000);
esp_deep_sleep_start();
```

This will sleep ESP32 between readings, saving power.

## Next Steps

1. ✅ Upload code to ESP32
2. ✅ Verify data appears in Supabase
3. → Build React PWA to visualize data
4. → Add remaining sensors (DO, Salinity)
5. → Deploy to aquaculture tank!

---

**Your code is now MQTT-enabled and ready to send data to the cloud!** 🚀
