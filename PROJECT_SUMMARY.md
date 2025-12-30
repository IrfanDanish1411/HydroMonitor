# IoT Water Quality Monitoring System - Project Summary

## Overview

This document provides a comprehensive summary of your IoT water quality monitoring system project, combining:
1. **Hardware implementation** from the research paper on Asian seabass aquaculture monitoring
2. **Software requirements** from CPC357 project specifications

---

## Key Findings from Research Paper

### System Architecture
The research paper describes a validated IoT-based water quality monitoring system with the following characteristics:

**Hardware Components:**
- **Microcontroller**: Arduino Uno R3
- **5 Water Quality Sensors**:
  1. DS18B20 Temperature sensor (waterproof, -55°C to +125°C, ±0.1°C accuracy)
  2. DFRobot pH sensor SEN0161 (range 0-14, ±0.05 pH accuracy)
  3. DFRobot Dissolved Oxygen sensor (0-20 mg/L, ±0.36 mg/L accuracy)
  4. MQ137 Ammonia gas sensor (5-500 mg/L, ±1.13 ppm accuracy)
  5. DFRobot EC sensor DFR0300 for salinity (±0.29 ppt accuracy)
- **Communication**: ESP8266 ESP-01 Wi-Fi module
- **Timing**: RTC (Real-Time Clock) module for accurate 6-hour intervals
- **Power**: 9V 1A DC adapter (total consumption ~162 mA)

**Innovative Features:**
1. **Linear Regression for Accuracy Improvement**: The system uses simple linear regression to improve sensor accuracy from 76-97% to 80-98% (R² values 0.80 → 0.98)
2. **Custom Sensor Casing**: Self-designed acrylic compartment protects sensors and extends lifespan from 1 year to >2 years
3. **Validated Performance**: 3-month validation against YSI Professional Plus probe

**Regression Equations** (integrated into Arduino code):
- Temperature: `y = 0.9105x + 2.7947`
- pH: `y = 0.867x + 1.0063`
- Ammonia: `y = 0.6782x - 0.006`
- Dissolved Oxygen: `y = 0.9127x - 0.4386`
- Salinity: `y = 1.1608x - 4.5934`

**Monitoring Thresholds** (for Asian Seabass):
- Temperature: 26-32°C
- pH: 7.0-8.5
- Dissolved Oxygen: 4.0-8.0 mg/L
- Ammonia: <0.02 ppm
- Salinity: 28-32 ppt

---

## CPC357 Project Requirements

### Technical Requirements

**Hardware Platform Options:**
- Raspberry Pi
- Maker Feather S3
- Any appropriate microcontroller with sensors
- **Recommendation**: Use Arduino Uno R3 as per research paper

**Cloud Platform Options:**
- AWS (Amazon Web Services)
- GCP (Google Cloud Platform)
- Other suitable platforms
- **Recommendation**: ThingSpeak (used in research paper) or AWS IoT Core

**Data Visualization:**
- Web or mobile application
- Must demonstrate real-time or historical data
- **Recommendation**: ThingSpeak web dashboard + Virtuino mobile app (as per research paper)

### Deliverables Required

1. **System Architecture**
   - Detailed architecture diagram
   - Component descriptions and interactions

2. **Hardware Documentation**
   - List of sensors and components
   - Justification for sensor selection
   - Hardware setup and configuration guide

3. **SDG 11 Impact Analysis**
   - How system addresses smart city challenges
   - Potential real-world impact

4. **GitHub/GitLab Repository**
   - All source code files
   - Comprehensive README
   - Setup and installation instructions
   - Dependencies and requirements

5. **YouTube Demonstration Video**
   - System overview and architecture
   - Live prototype demonstration
   - Data visualization showcase

### Grading Criteria (100%)

- **IoT System Design** (40%): Architecture, sensor selection, cloud integration, data visualization
- **Technical Documentation** (30%): Clear diagrams, code organization, accessible repository
- **SDG 11 Impact** (15%): Innovation and real-world applicability
- **Presentation** (15%): Clear demonstration video

---

## Recommended Implementation Approach

### Phase 1: Hardware Setup
1. Procure components (Arduino Uno R3 + 5 sensors + ESP8266 + RTC)
2. Assemble circuit according to pin configuration
3. Design and build sensor casing (acrylic compartment)
4. Calibrate all sensors using standard solutions

### Phase 2: Arduino Firmware
1. Develop sensor reading code
2. Implement linear regression equations for accuracy
3. Add RTC-based 6-hour interval timing
4. Integrate ESP8266 Wi-Fi communication
5. Implement threshold monitoring and alerts

### Phase 3: Cloud Integration
1. Set up cloud platform account (ThingSpeak/AWS/GCP)
2. Configure data ingestion endpoints
3. Create database schema for sensor data
4. Implement data storage and retrieval

### Phase 4: Data Visualization
1. Develop web dashboard (or use ThingSpeak built-in)
2. Create mobile app (Virtuino or custom)
3. Display real-time data for all 5 parameters
4. Add historical charts and data export
5. Implement alert notifications

### Phase 5: Documentation & Testing
1. Create system architecture diagrams
2. Write SDG 11 impact analysis
3. Prepare comprehensive README
4. Test end-to-end system for 24-48 hours
5. Record demonstration video
6. Prepare GitHub repository

---

## SDG 11 Connection (Smart Cities)

Your system addresses UN Sustainable Development Goal 11 in the following ways:

**Smart Water Management:**
- Real-time monitoring reduces manual labor and human error
- Prevents water quality degradation in urban aquaculture facilities
- Enables data-driven decision making for sustainable fish farming

**Environmental Sustainability:**
- Early detection prevents disease outbreaks and mass fish mortality
- Reduces chemical usage through precise monitoring
- Prevents eutrophication and environmental pollution

**Food Security:**
- Improves fish farming productivity and yields
- Supports urban food production systems
- Reduces losses from poor water quality management

**Technology Innovation:**
- Low-cost sensors make technology accessible
- IoT integration enables smart city infrastructure
- Scalable solution for multiple aquaculture facilities

---

## Key Advantages of This Approach

1. **Proven Accuracy**: Research paper validates 76-98% accuracy with linear regression
2. **Cost-Effective**: Uses low-cost DFRobot sensors (~$10-50 each)
3. **Long Lifespan**: Custom casing extends sensor life to >2 years
4. **Real-Time Monitoring**: 6-hour intervals provide timely data without overwhelming system
5. **Validated Design**: 3-month field testing in real aquaculture environment
6. **Scalable**: Can adapt to different water quality applications by changing thresholds

---

## Next Steps

1. **Confirm Hardware Platform**: Stick with Arduino Uno R3 or switch to Raspberry Pi/Feather S3?
2. **Select Cloud Platform**: ThingSpeak (easy), AWS IoT Core (professional), or GCP?
3. **Choose Visualization**: Web app, mobile app, or both?
4. **Procure Components**: Order sensors and hardware components
5. **Set Timeline**: Project due January 11, 2026 - plan backward from deadline

---

## Questions to Consider

1. Do you already have any of the hardware components?
2. What is your preferred cloud platform (AWS/GCP/ThingSpeak)?
3. Do you want to build a custom web/mobile app or use existing platforms (ThingSpeak/Virtuino)?
4. What type of water body will you monitor (aquaculture tank, river, lake, etc.)?
5. Do you need to adjust the threshold values for a different application?

---

## Resources

- **Research Paper Data**: Available at https://thingspeak.com/channels/1649792
- **Arduino Libraries Needed**: OneWire, DallasTemperature, RTClib, ESP8266WiFi
- **ThingSpeak**: https://thingspeak.com
- **Virtuino**: https://www.virtuino.com

---

**Due Date**: January 11, 2026, 11:00 PM (Malaysia Time)
