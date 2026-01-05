#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ---------- WiFi CREDENTIALS ----------
// TODO: Replace these with your actual WiFi credentials!
const char* ssid = "cslab";        // e.g., "MyHomeWiFi"
const char* password = "aksesg31"; // e.g., "MyPassword123"

// ---------- MQTT BROKER SETTINGS ----------
// TODO: Replace with your GCP VM's EXTERNAL IP address!
const char* mqtt_server = "34.123.3.3";  // e.g., "34.101.123.45" (find in GCP Console)
const int mqtt_port = 1883;
const char* mqtt_topic = "water-quality/sensor-data";
const char* device_id = "esp32-001";

// ---------- PIN DEFINITIONS ----------
#define ONE_WIRE_BUS 4      // DS18B20 data
#define MQ137_PIN    34     // MQ137 analog output
#define PH_PIN       32     // pH Sensor analog output
#define PUMP_PIN     26     // Relay IN connected to GPIO 26

// ---------- PARAMETERS ----------
#define ADC_MAX      4095.0
#define VREF         3.3       
#define RL_VALUE     10.0      
#define PH_OFFSET    19.91     

// ---------- CALIBRATION CONSTANTS ----------
const float RS_AIR = 6.5; 
const float RO_CLEAN_AIR_FACTOR = 28.5;
float calibratedR0 = RS_AIR / RO_CLEAN_AIR_FACTOR;

// Sensor reading interval (1 minute for publishing)
#define READING_INTERVAL 60000 

// ---------- SENSOR SETUP ----------
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// ---------- WiFi & MQTT SETUP ----------
WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastReadingTime = 0;

// ---------- WiFi CONNECTION ----------
void connectWiFi() {
  Serial.println("\n>>> Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Connection Failed!");
  }
}

// ---------- MQTT CONNECTION ----------
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print(">>> Connecting to MQTT broker...");
    
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" ✅ Connected!");
    } else {
      Serial.print(" ❌ Failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

// ---------- PUBLISH SENSOR DATA ----------
void publishSensorData(float temp, float ph, float ammonia) {
  // Create JSON document
  StaticJsonDocument<256> doc;
  doc["device_id"] = device_id;
  doc["temperature"] = round(temp * 10) / 10.0;
  doc["ph"] = round(ph * 100) / 100.0;
  doc["dissolved_oxygen"] = 6.5; 
  doc["ammonia"] = round(ammonia * 10) / 10.0;
  doc["salinity"] = 30.0;
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  Serial.println("\n>>> Publishing to MQTT...");
  Serial.println(buffer);
  
  if (mqttClient.publish(mqtt_topic, buffer)) {
    Serial.println("✅ Data published successfully!");
  } else {
    Serial.println("❌ Publish failed!");
  }
}

// ---------- SETUP ----------
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("======================================");
  Serial.println(" WATER MONITORING SYSTEM (AUTOMATED) ");
  Serial.println("======================================");
  
  sensors.begin();
  analogSetPinAttenuation(MQ137_PIN, ADC_11db);
  analogSetPinAttenuation(PH_PIN, ADC_11db);
  
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, HIGH); // Start OFF (Active LOW relay)

  connectWiFi();
  delay(2000);
  
  mqttClient.setServer(mqtt_server, mqtt_port);
  if (WiFi.status() == WL_CONNECTED) {
    connectMQTT();
  }
  
  Serial.println("System Initialized: Automated Mode");
  Serial.println("======================================\n");
}

// ---------- MAIN LOOP ----------
void loop() {
  unsigned long currentMillis = millis();

  // Ensure Cloud Connectivity
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();

  // 1. READ TEMPERATURE
  sensors.requestTemperatures();
  float tempC = sensors.getTempCByIndex(0);

  // 2. READ AMMONIA (MQ137)
  int rawGas = analogRead(MQ137_PIN);
  float gasVoltsESP = (rawGas / ADC_MAX) * VREF;
  float gasVoltsActual = gasVoltsESP * 11.0; 
  if (gasVoltsActual < 0.1) gasVoltsActual = 0.1;
  float Rs = ((5.0 - gasVoltsActual) / gasVoltsActual) * RL_VALUE;
  float ppm_est = pow(10, (log10(Rs / calibratedR0) * -1.25 + 1.8));

  // 3. READ pH (40-sample average)
  long phSum = 0;
  for (int i = 0; i < 40; i++) { 
    phSum += analogRead(PH_PIN); 
    delay(2); 
  }
  float phValue = ((phSum / 40.0 / ADC_MAX) * VREF * 5.70) + PH_OFFSET; 

  // ==========================================
  // THRESHOLD LOGIC & PUMP CONTROL
  // ==========================================
  String waterStatus = "HEALTHY";
  bool shouldPumpRun = false;

  if (ppm_est > 2.0) {
    waterStatus = (ppm_est > 10.0) ? "DANGER: AMMONIA" : "WARNING: AMMONIA";
    shouldPumpRun = true;
  }
  if (phValue < 6.0 || phValue > 9.0) {
    waterStatus = "CRITICAL: pH";
    shouldPumpRun = true;
  }
  if (tempC > 32.0) {
    waterStatus = "ALERT: TEMP HIGH";
    shouldPumpRun = true;
  }

  // --- PHYSICAL ACTUATION (Active LOW Relay) ---
  if (shouldPumpRun) {
    digitalWrite(PUMP_PIN, LOW);   // ON
  } else {
    digitalWrite(PUMP_PIN, HIGH);  // OFF
  }

  // --- SERIAL OUTPUT ---
  Serial.print(shouldPumpRun ? "[PUMP: ON ] " : "[PUMP: OFF] ");
  Serial.print("| T: "); Serial.print(tempC, 1);
  Serial.print("C | NH3: "); Serial.print(ppm_est, 1);
  Serial.print(" ppm | pH: "); Serial.print(phValue, 2);
  Serial.print(" | STATUS: "); Serial.println(waterStatus);

  // --- PUBLISH TO MQTT (Every 1 minute) ---
  if (currentMillis - lastReadingTime >= READING_INTERVAL || lastReadingTime == 0) {
    publishSensorData(tempC, phValue, ppm_est);
    lastReadingTime = currentMillis;
  }

  delay(1000); 
}





