# IoT Water Quality Monitoring System

A comprehensive IoT-based water quality monitoring system designed for aquaculture (specifically Asian Seabass), integrating hardware sensors, cloud data processing, and a modern web dashboard.

## 📌 Project Overview

This system monitors critical water quality parameters in real-time to ensure optimal conditions for fish farming. It replaces manual testing with automated data collection and provides instant alerts for critical events.

**Key Features:**
- **Real-time Monitoring**: Tracks Temperature, pH, Dissolved Oxygen, Ammonia, and Salinity.
- **Accuracy Improvement**: Implements linear regression algorithms to enhance sensor precision (R² > 0.98).
- **Cloud Integration**: Uses MQTT and Supabase for reliable data transmission and storage.
- **Interactive Dashboard**: A React-based web application for data visualization and alerts.
- **SDG 11 Aligned**: Contributes to sustainable cities by enabling smart, efficient urban farming.

## 🏗️ System Architecture

1.  **Hardware Layer**: ESP32/Arduino microcontroller connected to water quality sensors.
2.  **Communication Layer**: MQTT Protocol for lightweight data transmission.
3.  **Processing Layer**: Python Bridge (`mqtt_to_supabase.py`) that subscribes to sensor data, processes it (threshold checks), and stores it.
4.  **Storage Layer**: Supabase (PostgreSQL) for relational data storage.
5.  **Presentation Layer**: React.js Dashboard for monitoring and historical analysis.

## 🚀 Setup Steps (Start to Finish)

### Prerequisites
- **Hardware**: ESP32 Board, Sensors (DS18B20, Analog pH, etc.)
- **Software**: 
  - Node.js (v16+) & npm
  - Python (v3.8+)
  - Arduino IDE
  - Git

### Phase 1: Hardware & Firmware
1.  **Assembly**: Connect your sensors to the ESP32. Refer to the pin definitions in the firmware code for exact GPIO mappings.
2.  **Firmware Setup**:
    - Open `src/esp32/water_quality_mqtt/water_quality_mqtt.ino` in Arduino IDE.
    - Install required libraries: `OneWire`, `DallasTemperature`, `PubSubClient`, `ArduinoJson`.
    - Configure your WiFi and MQTT Broker settings in the code.
    - Upload the sketch to your ESP32.

### Phase 2: Cloud & Backend
1.  **Supabase Setup**:
    - Create a new Supabase project.
    - Set up the database schema (Tables: `sensor_readings`, `alerts`, `thresholds`).
2.  **MQTT Bridge**:
    - Navigate to the bridge directory:
      ```bash
      cd src/cloud/mqtt_bridge
      ```
    - Install Python dependencies:
      ```bash
      pip install -r requirements.txt
      ```
    - Configure environment variables:
      ```bash
      cp .env.example .env
      ```
      *Edit `.env` with your Supabase URL, Key, and MQTT Broker details.*
    - Start the bridge:
      ```bash
      python mqtt_to_supabase.py
      ```

### Phase 3: Web Dashboard Setup
1.  **Installation**:
    - Navigate to the dashboard directory:
      ```bash
      cd water-quality-dashboard
      ```
    - Install Node dependencies:
      ```bash
      npm install
      ```
2.  **Configuration**:
    - Create the environment file:
      ```bash
      cp .env.example .env
      ```
    - Add your Supabase credentials to `.env` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
3.  **Running the App**:
    - Start the local development server:
      ```bash
      npm run dev
      ```
    - Open your browser to `http://localhost:5173`.

## 🌍 SDG 11 Connection (Sustainable Cities and Communities)

This project directly addresses **Target 11.6** (Reducing adverse per capita environmental impact of cities) by:
- **Smart Water Management**: Automating quality checks reduces resource waste and prevents pollution in urban aquaculture.
- **Food Security**: Supporting efficient urban farming to provide local food sources, reducing food transport footprints.
- **Environmental Protection**: Early detection of toxic ammonia levels prevents mass fish mortality and environmental contamination.

## 📂 Project Structure

```
iot-357/
├── src/
│   ├── esp32/              # Arduino/ESP32 Firmware code
│   └── cloud/              # Python MQTT Bridge & Cloud Functions
├── water-quality-dashboard/ # React.js Frontend Application
├── docs/                   # Documentation resources
└── PROJECT_SUMMARY.md      # Detailed project requirements notes
```

---
*Created for CPC357 - IoT Systems Project*
