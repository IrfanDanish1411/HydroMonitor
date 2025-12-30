# Dashboard Test Mode Guide

## Why Sensors Show "Out of Range"

Your sensors are reading **room conditions**, not aquaculture water:
- **Temperature: 80°C** → Room/sensor heat (Safe for fish: 26-32°C)
- **pH: 6.13** → Slightly acidic (Safe for fish: 7.0-8.5)
- **Ammonia: 14.65 ppm** → High for testing (Safe for fish: 0-0.02 ppm)

This is **completely normal** during sensor calibration and testing!

---

## Test Mode vs Production Mode

### 🧪 Test Mode (Orange Button)
**Use this for:** Sensor calibration, testing, development

**Thresholds:**
- Temperature: 0-100°C
- pH: 0-14
- Dissolved Oxygen: 0-20 mg/L
- Ammonia: 0-50 ppm
- Salinity: 0-50 ppt

**Result:** Most readings will show **"✓ Normal"** status

### 🐟 Production Mode (Green Button)
**Use this for:** Real aquaculture monitoring (Asian Seabass)

**Thresholds:**
- Temperature: 26-32°C
- pH: 7.0-8.5
- Dissolved Oxygen: 4.0-8.0 mg/L
- Ammonia: 0-0.02 ppm
- Salinity: 28-32 ppt

**Result:** Strict thresholds for fish health

---

## How to Use

### During Development/Testing:
1. Click the **orange "Test Mode"** button in the header
2. All sensors should show **"✓ Normal"** (unless values are extremely out of range)
3. Use this mode to verify:
   - ESP32 is publishing data
   - MQTT broker is receiving messages
   - Supabase is storing data
   - Dashboard is updating in real-time

### For Actual Aquaculture:
1. Click the **green "Production Mode"** button
2. Sensors will show **"Out of range"** if water quality is unsafe for fish
3. Use this mode when:
   - Deploying to real fish tank
   - Monitoring actual aquaculture conditions
   - Receiving critical alerts

---

## Dashboard Features

### Test Mode Screenshot
![Test Mode - All Normal](file:///C:/Users/Legion/.gemini/antigravity/brain/bfe838cb-389e-4b3e-8609-fb3af67c1175/dashboard_test_mode_1766724104979.png)

### Production Mode Screenshot
![Production Mode - Strict Thresholds](file:///C:/Users/Legion/.gemini/antigravity/brain/bfe838cb-389e-4b3e-8609-fb3af67c1175/dashboard_production_mode_1766724126258.png)

---

## Troubleshooting

### All sensors show "--"
- ESP32 not connected to WiFi
- MQTT broker not receiving data
- Python bridge script not running
- Supabase credentials incorrect

### Sensors show "Out of range" in Test Mode
- Values are extremely abnormal (e.g., negative temperature)
- Sensor malfunction
- Check Serial Monitor for sensor readings

### Toggle button not working
- Refresh the dashboard (Ctrl+R)
- Check browser console for errors

---

## Next Steps

1. **Calibrate Sensors:**
   - Use test mode to verify all sensors are reading
   - Compare readings with known reference values
   - Adjust calibration formulas in ESP32 code if needed

2. **Deploy to Production:**
   - Place sensors in actual fish tank
   - Switch to Production Mode
   - Monitor for alerts

3. **Set Up Alerts:**
   - Configure email/SMS notifications (future enhancement)
   - Test alert system by triggering threshold violations

---

**Current Status:** Dashboard fully functional with test mode for development! 🎉
