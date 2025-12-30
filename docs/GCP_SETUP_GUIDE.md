# GCP Setup Guide for IoT Water Quality Monitoring System

This guide provides step-by-step instructions for setting up Google Cloud Platform infrastructure for the water quality monitoring system.

## Prerequisites

- Google Cloud Platform account
- GCP project created
- `gcloud` CLI installed and configured
- Billing enabled on GCP project

## Step 1: Enable Required APIs

```bash
# Enable all required APIs
gcloud services enable cloudiot.googleapis.com
gcloud services enable pubsub.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable bigquery.googleapis.com
gcloud services enable run.googleapis.com
```

## Step 2: Create Pub/Sub Topics and Subscriptions

```bash
# Create topic for device telemetry
gcloud pubsub topics create water-quality-telemetry

# Create topic for device state
gcloud pubsub topics create water-quality-state

# Create subscription for Cloud Functions
gcloud pubsub subscriptions create water-quality-telemetry-sub \
    --topic=water-quality-telemetry
```

## Step 3: Create IoT Core Registry

```bash
# Set environment variables
export PROJECT_ID="your-project-id"
export REGION="asia-southeast1"  # Choose closest region
export REGISTRY_ID="water-quality-registry"

# Create IoT Core registry
gcloud iot registries create $REGISTRY_ID \
    --project=$PROJECT_ID \
    --region=$REGION \
    --event-notification-config=topic=water-quality-telemetry \
    --state-pubsub-topic=water-quality-state
```

## Step 4: Generate Device Keys

```bash
# Generate ES256 key pair for device authentication
openssl ecparam -genkey -name prime256v1 -noout -out esp32_private.pem
openssl ec -in esp32_private.pem -pubout -out esp32_public.pem

# Or generate RSA key pair (alternative)
# openssl genrsa -out esp32_private.pem 2048
# openssl rsa -in esp32_private.pem -pubout -out esp32_public.pem
```

## Step 5: Register ESP32 Device

```bash
# Set device ID
export DEVICE_ID="esp32-water-monitor-001"

# Register device with public key
gcloud iot devices create $DEVICE_ID \
    --project=$PROJECT_ID \
    --region=$REGION \
    --registry=$REGISTRY_ID \
    --public-key path=esp32_public.pem,type=es256
```

## Step 6: Set Up Firestore Database

```bash
# Create Firestore database (Native mode)
gcloud firestore databases create --region=$REGION

# Note: You'll need to create collections and documents via code or console
# Collections needed:
# - sensor_readings (latest data)
# - alerts (alert history)
# - device_status (device metadata)
```

## Step 7: Create BigQuery Dataset and Table

```bash
# Create dataset
bq mk --dataset \
    --location=asia-southeast1 \
    ${PROJECT_ID}:water_quality_data

# Create table for sensor readings
bq mk --table \
    ${PROJECT_ID}:water_quality_data.sensor_readings \
    timestamp:TIMESTAMP,device_id:STRING,temperature:FLOAT,ph:FLOAT,dissolved_oxygen:FLOAT,ammonia:FLOAT,salinity:FLOAT
```

## Step 8: Deploy Cloud Functions

### Function 1: Process Sensor Data

Create `functions/process_sensor_data/main.py`:

```python
import base64
import json
from google.cloud import firestore
from google.cloud import bigquery
from datetime import datetime

db = firestore.Client()
bq_client = bigquery.Client()

def process_sensor_data(event, context):
    """Triggered by Pub/Sub message from IoT Core"""
    
    # Decode Pub/Sub message
    pubsub_message = base64.b64decode(event['data']).decode('utf-8')
    data = json.loads(pubsub_message)
    
    # Add timestamp
    data['timestamp'] = datetime.utcnow()
    
    # Store in Firestore (latest reading)
    db.collection('sensor_readings').document(data['device_id']).set(data)
    
    # Store in BigQuery (historical data)
    table_id = f"{bq_client.project}.water_quality_data.sensor_readings"
    errors = bq_client.insert_rows_json(table_id, [data])
    
    # Check thresholds and create alerts
    check_thresholds(data)
    
    return 'OK'

def check_thresholds(data):
    """Check if sensor values exceed thresholds"""
    thresholds = {
        'temperature': (26, 32),
        'ph': (7.0, 8.5),
        'dissolved_oxygen': (4.0, 8.0),
        'ammonia': (0, 0.02),
        'salinity': (28, 32)
    }
    
    alerts = []
    for param, (min_val, max_val) in thresholds.items():
        value = data.get(param)
        if value and (value < min_val or value > max_val):
            alert = {
                'device_id': data['device_id'],
                'parameter': param,
                'value': value,
                'threshold': f"{min_val}-{max_val}",
                'timestamp': data['timestamp'],
                'severity': 'high' if param == 'dissolved_oxygen' else 'medium'
            }
            alerts.append(alert)
            db.collection('alerts').add(alert)
    
    return alerts
```

Create `functions/process_sensor_data/requirements.txt`:

```
google-cloud-firestore==2.11.1
google-cloud-bigquery==3.11.4
```

Deploy the function:

```bash
gcloud functions deploy process_sensor_data \
    --runtime python39 \
    --trigger-topic water-quality-telemetry \
    --entry-point process_sensor_data \
    --region $REGION \
    --source functions/process_sensor_data
```

### Function 2: Get Latest Data (HTTP endpoint for web app)

Create `functions/get_latest_data/main.py`:

```python
from google.cloud import firestore
from flask import jsonify

db = firestore.Client()

def get_latest_data(request):
    """HTTP endpoint to get latest sensor readings"""
    
    # Enable CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
        return ('', 204, headers)
    
    headers = {'Access-Control-Allow-Origin': '*'}
    
    # Get device_id from query params
    device_id = request.args.get('device_id', 'esp32-water-monitor-001')
    
    # Query Firestore
    doc_ref = db.collection('sensor_readings').document(device_id)
    doc = doc_ref.get()
    
    if doc.exists:
        data = doc.to_dict()
        # Convert timestamp to string
        if 'timestamp' in data:
            data['timestamp'] = data['timestamp'].isoformat()
        return (jsonify(data), 200, headers)
    else:
        return (jsonify({'error': 'No data found'}), 404, headers)
```

Deploy:

```bash
gcloud functions deploy get_latest_data \
    --runtime python39 \
    --trigger-http \
    --allow-unauthenticated \
    --entry-point get_latest_data \
    --region $REGION \
    --source functions/get_latest_data
```

## Step 9: Configure ESP32 Credentials

After device registration, you'll need to configure the ESP32 with:

1. **Wi-Fi credentials**: SSID and password
2. **GCP project ID**: Your GCP project ID
3. **Cloud region**: e.g., "asia-southeast1"
4. **Registry ID**: "water-quality-registry"
5. **Device ID**: "esp32-water-monitor-001"
6. **Private key**: Contents of `esp32_private.pem` (convert to C string array)

## Step 10: Test the Setup

```bash
# Publish test message to IoT Core
gcloud iot devices publish \
    --project=$PROJECT_ID \
    --region=$REGION \
    --registry=$REGISTRY_ID \
    --device=$DEVICE_ID \
    --message='{"temperature":28.5,"ph":7.8,"dissolved_oxygen":6.2,"ammonia":0.01,"salinity":30.1,"device_id":"esp32-water-monitor-001"}'

# Check if data appears in Firestore
# (Use GCP Console or gcloud firestore commands)

# Query BigQuery
bq query --use_legacy_sql=false \
    'SELECT * FROM `'${PROJECT_ID}'.water_quality_data.sensor_readings` LIMIT 10'
```

## Step 11: Deploy Web Application

See separate guide for deploying React web app to Cloud Run or Firebase Hosting.

## Useful Commands

```bash
# View IoT Core device list
gcloud iot devices list --registry=$REGISTRY_ID --region=$REGION

# View device config
gcloud iot devices describe $DEVICE_ID --registry=$REGISTRY_ID --region=$REGION

# View Pub/Sub messages
gcloud pubsub subscriptions pull water-quality-telemetry-sub --limit=10

# View Cloud Function logs
gcloud functions logs read process_sensor_data --region=$REGION

# Delete resources (cleanup)
gcloud iot devices delete $DEVICE_ID --registry=$REGISTRY_ID --region=$REGION
gcloud iot registries delete $REGISTRY_ID --region=$REGION
gcloud pubsub topics delete water-quality-telemetry
gcloud pubsub topics delete water-quality-state
```

## Security Best Practices

1. **Never commit private keys to Git** - Add `*.pem` to `.gitignore`
2. **Use environment variables** for sensitive configuration
3. **Enable Cloud Functions authentication** for production (remove `--allow-unauthenticated`)
4. **Use VPC Service Controls** to restrict API access
5. **Enable Cloud Audit Logs** for compliance
6. **Rotate device keys periodically** (every 6-12 months)

## Cost Optimization

1. **Use Firestore in Native mode** (cheaper than Datastore mode)
2. **Set BigQuery table expiration** (e.g., 1 year) to reduce storage costs
3. **Use Cloud Functions 2nd gen** for better performance and pricing
4. **Enable Cloud CDN** for web app if serving globally
5. **Use committed use discounts** for long-term deployments

## Troubleshooting

### Device cannot connect to IoT Core
- Verify device keys are correct (public key registered, private key on ESP32)
- Check Wi-Fi connectivity
- Verify MQTT broker address: `mqtt.googleapis.com:8883`
- Check device clock is synchronized (NTP)

### Data not appearing in Firestore/BigQuery
- Check Cloud Function logs for errors
- Verify Pub/Sub subscription is active
- Check IAM permissions for Cloud Functions service account

### High latency or timeouts
- Check Cloud Function cold start times
- Consider using Cloud Functions 2nd gen with min instances
- Optimize BigQuery queries with partitioning and clustering
