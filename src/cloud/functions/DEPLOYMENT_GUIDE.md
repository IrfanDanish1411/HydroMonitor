# Cloud Function Deployment Guide

## Prerequisites

1. **GCP Project Setup** (from GCP_SETUP_GUIDE.md)
   - GCP project created
   - IoT Core registry created
   - Pub/Sub topic `water-quality-telemetry` created

2. **Supabase Credentials**
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY

## Deployment Steps

### Step 1: Set Environment Variables

```bash
# Replace with your actual values
export SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
export SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
export GCP_PROJECT_ID="your-gcp-project-id"
export GCP_REGION="asia-southeast1"
```

### Step 2: Deploy Cloud Function

```bash
cd "c:\Users\Legion\Desktop\iot 357"

gcloud functions deploy process_sensor_data \
    --runtime python39 \
    --trigger-topic water-quality-telemetry \
    --entry-point process_sensor_data \
    --region asia-southeast1 \
    --set-env-vars SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY \
    --source src/cloud/functions/process_sensor_data \
    --project $GCP_PROJECT_ID
```

### Step 3: Test the Function

#### Option 1: Test with gcloud command

```bash
gcloud pubsub topics publish water-quality-telemetry \
    --message='{"device_id":"esp32-001","temperature":28.5,"ph":7.8,"dissolved_oxygen":6.2,"ammonia":0.01,"salinity":30.1}' \
    --project $GCP_PROJECT_ID
```

#### Option 2: Test via GCP Console

1. Go to Cloud Functions in GCP Console
2. Click on `process_sensor_data`
3. Click "Testing" tab
4. Enter test data:
```json
{
  "data": "eyJkZXZpY2VfaWQiOiJlc3AzMi0wMDEiLCJ0ZW1wZXJhdHVyZSI6MjguNSwicGgiOjcuOCwiZGlzc29sdmVkX294eWdlbiI6Ni4yLCJhbW1vbmlhIjowLjAxLCJzYWxpbml0eSI6MzAuMX0="
}
```
5. Click "Test the function"

### Step 4: Verify Data in Supabase

1. Go to Supabase dashboard
2. Click "Table Editor"
3. Open `sensor_readings` table
4. You should see the test data!

## Troubleshooting

### Function deployment fails
- Check you have correct permissions in GCP
- Verify Pub/Sub topic exists
- Check Python runtime is supported

### Data not appearing in Supabase
- Check Cloud Function logs: `gcloud functions logs read process_sensor_data`
- Verify SUPABASE_URL and SUPABASE_SERVICE_KEY are correct
- Check Supabase table exists and has correct schema

### Permission errors
- Ensure Cloud Function service account has Pub/Sub subscriber role
- Verify Supabase service key has insert permissions

## Next Steps

After successful deployment:
1. ✅ Cloud Function deployed
2. ✅ Data flowing to Supabase
3. → Proceed to Part 3: Build PWA
4. → Or set up ESP32 hardware
