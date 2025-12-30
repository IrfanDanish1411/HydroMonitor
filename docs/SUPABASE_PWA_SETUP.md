# Supabase + PWA Setup Guide

This guide covers setting up Supabase as the database and implementing Progressive Web App features for mobile support.

## Part 1: Supabase Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in project details:
   - Name: `water-quality-monitor`
   - Database Password: (save this securely)
   - Region: Choose closest to your location
4. Wait for project to be provisioned (~2 minutes)

### Step 2: Create Database Schema

Go to SQL Editor in Supabase dashboard and run:

```sql
-- Sensor readings table
CREATE TABLE sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  temperature DECIMAL(5,2),
  ph DECIMAL(4,2),
  dissolved_oxygen DECIMAL(5,2),
  ammonia DECIMAL(5,3),
  salinity DECIMAL(5,2)
);

-- Create indexes for faster queries
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX idx_sensor_readings_device ON sensor_readings(device_id);

-- Alerts table
CREATE TABLE alerts (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  parameter TEXT NOT NULL,
  value DECIMAL(10,3),
  threshold_min DECIMAL(10,3),
  threshold_max DECIMAL(10,3),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE
);

-- Create index for alerts
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX idx_alerts_device ON alerts(device_id);

-- Enable Row Level Security (RLS)
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
-- (Adjust for production - add authentication)
CREATE POLICY "Allow public read access" ON sensor_readings
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON alerts
  FOR SELECT USING (true);
```

### Step 3: Enable Realtime

1. Go to Database → Replication in Supabase dashboard
2. Enable replication for `sensor_readings` table
3. Enable replication for `alerts` table

### Step 4: Get API Credentials

1. Go to Settings → API
2. Copy the following:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon (public) key**: `eyJhbGc...` (for PWA)
   - **Service role key**: `eyJhbGc...` (for Cloud Functions - keep secret!)

---

## Part 2: Update Cloud Function for Supabase

### Cloud Function Code

**File**: `src/cloud/functions/process_sensor_data/main.py`

```python
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
    """Triggered by Pub/Sub message from IoT Core"""
    
    try:
        # Decode Pub/Sub message
        pubsub_message = base64.b64decode(event['data']).decode('utf-8')
        data = json.loads(pubsub_message)
        
        # Insert into Supabase
        result = supabase.table('sensor_readings').insert({
            'device_id': data.get('device_id', 'esp32-001'),
            'temperature': float(data.get('temperature')),
            'ph': float(data.get('ph')),
            'dissolved_oxygen': float(data.get('dissolved_oxygen')),
            'ammonia': float(data.get('ammonia')),
            'salinity': float(data.get('salinity'))
        }).execute()
        
        print(f"Data inserted: {result}")
        
        # Check thresholds and create alerts
        check_thresholds(data)
        
        return 'OK'
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return f'Error: {str(e)}', 500

def check_thresholds(data):
    """Check if values exceed thresholds and create alerts"""
    thresholds = {
        'temperature': (26, 32),
        'ph': (7.0, 8.5),
        'dissolved_oxygen': (4.0, 8.0),
        'ammonia': (0, 0.02),
        'salinity': (28, 32)
    }
    
    device_id = data.get('device_id', 'esp32-001')
    
    for param, (min_val, max_val) in thresholds.items():
        value = data.get(param)
        if value is not None:
            value = float(value)
            if value < min_val or value > max_val:
                # Determine severity
                if param == 'dissolved_oxygen' or param == 'ammonia':
                    severity = 'high'
                elif abs(value - min_val) > (max_val - min_val) * 0.5:
                    severity = 'medium'
                else:
                    severity = 'low'
                
                # Insert alert
                supabase.table('alerts').insert({
                    'device_id': device_id,
                    'parameter': param,
                    'value': value,
                    'threshold_min': min_val,
                    'threshold_max': max_val,
                    'severity': severity
                }).execute()
                
                print(f"Alert created: {param} = {value} (threshold: {min_val}-{max_val})")
```

**File**: `src/cloud/functions/process_sensor_data/requirements.txt`

```
supabase==2.3.4
```

### Deploy Cloud Function

```bash
# Set environment variables
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"

# Deploy function
gcloud functions deploy process_sensor_data \
    --runtime python39 \
    --trigger-topic water-quality-telemetry \
    --entry-point process_sensor_data \
    --region asia-southeast1 \
    --set-env-vars SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY \
    --source src/cloud/functions/process_sensor_data
```

---

## Part 3: Progressive Web App (PWA) Setup

### Step 1: Create React App with PWA Template

```bash
# Create React app with TypeScript and PWA template
npx create-react-app water-quality-pwa --template cra-template-pwa-typescript

cd water-quality-pwa
```

### Step 2: Install Dependencies

```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install @supabase/supabase-js
npm install recharts date-fns
npm install --save-dev @types/recharts
```

### Step 3: Configure Environment Variables

Create `.env` file:

```env
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### Step 4: Update PWA Manifest

Edit `public/manifest.json`:

```json
{
  "short_name": "AquaMonitor",
  "name": "IoT Water Quality Monitor",
  "description": "Real-time aquaculture water quality monitoring system",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1976d2",
  "background_color": "#ffffff",
  "orientation": "portrait-primary",
  "categories": ["productivity", "utilities"],
  "screenshots": []
}
```

### Step 5: Create Supabase Client

**File**: `src/services/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions
export interface SensorReading {
  id: number
  device_id: string
  timestamp: string
  temperature: number
  ph: number
  dissolved_oxygen: number
  ammonia: number
  salinity: number
}

export interface Alert {
  id: number
  device_id: string
  parameter: string
  value: number
  threshold_min: number
  threshold_max: number
  severity: 'low' | 'medium' | 'high'
  timestamp: string
  acknowledged: boolean
}

// Fetch latest sensor reading
export const getLatestReading = async (deviceId: string = 'esp32-001') => {
  const { data, error } = await supabase
    .from('sensor_readings')
    .select('*')
    .eq('device_id', deviceId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()
  
  if (error) throw error
  return data as SensorReading
}

// Fetch historical data
export const getHistoricalData = async (
  deviceId: string = 'esp32-001',
  hours: number = 24
) => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  
  const { data, error } = await supabase
    .from('sensor_readings')
    .select('*')
    .eq('device_id', deviceId)
    .gte('timestamp', since)
    .order('timestamp', { ascending: true })
  
  if (error) throw error
  return data as SensorReading[]
}

// Subscribe to real-time updates
export const subscribeToSensorData = (
  deviceId: string = 'esp32-001',
  callback: (data: SensorReading) => void
) => {
  return supabase
    .channel('sensor_readings')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sensor_readings',
        filter: `device_id=eq.${deviceId}`
      },
      (payload) => callback(payload.new as SensorReading)
    )
    .subscribe()
}

// Fetch unacknowledged alerts
export const getAlerts = async (deviceId: string = 'esp32-001') => {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('device_id', deviceId)
    .eq('acknowledged', false)
    .order('timestamp', { ascending: false })
  
  if (error) throw error
  return data as Alert[]
}
```

### Step 6: Create Realtime Hook

**File**: `src/hooks/useRealtime.ts`

```typescript
import { useEffect, useState } from 'react'
import { subscribeToSensorData, SensorReading } from '../services/supabase'

export const useRealtime = (deviceId: string = 'esp32-001') => {
  const [latestData, setLatestData] = useState<SensorReading | null>(null)

  useEffect(() => {
    const subscription = subscribeToSensorData(deviceId, (data) => {
      setLatestData(data)
      
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Water Quality Data', {
          body: `Temperature: ${data.temperature}°C, pH: ${data.ph}`,
          icon: '/icon-192.png'
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [deviceId])

  return latestData
}
```

### Step 7: Enable Service Worker

Edit `src/index.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA
serviceWorkerRegistration.register({
  onSuccess: () => console.log('Service worker registered'),
  onUpdate: (registration) => {
    console.log('New version available')
    // Optionally show update prompt to user
  }
});

// Request notification permission
if ('Notification' in window) {
  Notification.requestPermission().then(permission => {
    console.log('Notification permission:', permission)
  })
}
```

### Step 8: Create Dashboard Component

**File**: `src/components/Dashboard.tsx`

```typescript
import React, { useEffect, useState } from 'react'
import { Container, Grid, Paper, Typography } from '@mui/material'
import { getLatestReading, getHistoricalData } from '../services/supabase'
import { useRealtime } from '../hooks/useRealtime'
import ParameterCard from './ParameterCard'
import HistoricalChart from './HistoricalChart'

const Dashboard: React.FC = () => {
  const [latestData, setLatestData] = useState<any>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const realtimeData = useRealtime()

  useEffect(() => {
    // Fetch initial data
    getLatestReading().then(setLatestData)
    getHistoricalData('esp32-001', 24).then(setHistoricalData)
  }, [])

  useEffect(() => {
    // Update when realtime data arrives
    if (realtimeData) {
      setLatestData(realtimeData)
      setHistoricalData(prev => [...prev, realtimeData])
    }
  }, [realtimeData])

  if (!latestData) return <Typography>Loading...</Typography>

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Water Quality Monitor
      </Typography>
      
      <Grid container spacing={3}>
        {/* Parameter Cards */}
        <Grid item xs={12} sm={6} md={4}>
          <ParameterCard
            title="Temperature"
            value={latestData.temperature}
            unit="°C"
            min={26}
            max={32}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ParameterCard
            title="pH"
            value={latestData.ph}
            unit=""
            min={7.0}
            max={8.5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ParameterCard
            title="Dissolved Oxygen"
            value={latestData.dissolved_oxygen}
            unit="mg/L"
            min={4.0}
            max={8.0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ParameterCard
            title="Ammonia"
            value={latestData.ammonia}
            unit="ppm"
            min={0}
            max={0.02}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ParameterCard
            title="Salinity"
            value={latestData.salinity}
            unit="ppt"
            min={28}
            max={32}
          />
        </Grid>
        
        {/* Historical Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <HistoricalChart data={historicalData} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default Dashboard
```

### Step 9: Build and Deploy

```bash
# Build PWA
npm run build

# Deploy to Cloud Run
gcloud run deploy water-quality-pwa \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated
```

---

## Part 4: Testing PWA Features

### Test Installation

1. Open app in Chrome/Edge on desktop or mobile
2. Look for install prompt in address bar
3. Click "Install" to add to home screen
4. App should open in standalone mode (no browser UI)

### Test Offline Support

1. Open app and let it load data
2. Turn off Wi-Fi/mobile data
3. Refresh page - should still show cached data
4. Service worker serves cached assets

### Test Push Notifications

1. Grant notification permission when prompted
2. Wait for new sensor data (or insert test data in Supabase)
3. Notification should appear even if app is in background

### Test Realtime Updates

1. Open app on multiple devices/tabs
2. Insert new data in Supabase SQL editor:
   ```sql
   INSERT INTO sensor_readings (device_id, temperature, ph, dissolved_oxygen, ammonia, salinity)
   VALUES ('esp32-001', 28.5, 7.8, 6.2, 0.01, 30.1);
   ```
3. All connected clients should update instantly

---

## Cost Comparison

### Supabase (Free Tier)
- 500MB database storage
- 2GB bandwidth/month
- Unlimited API requests
- Realtime subscriptions included
- **Cost**: $0/month (free tier)

### GCP (Paid)
- IoT Core: ~$0.50/month
- Pub/Sub: ~$0.10/month
- Cloud Functions: ~$0.20/month
- Cloud Run: ~$0-5/month
- **Total**: ~$0.80-6/month

### Combined Total: ~$0.80-6/month

Much cheaper than Firestore + BigQuery!

---

## Advantages of Supabase + PWA

✅ **Real-time by default** - No polling needed
✅ **PostgreSQL** - Powerful SQL queries for analytics
✅ **Free tier** - Generous limits for student projects
✅ **Easy setup** - No complex GCP configuration
✅ **PWA** - Works on all platforms (iOS, Android, Desktop)
✅ **Offline support** - Service worker caches data
✅ **Installable** - Feels like native app
✅ **Push notifications** - Alert users anywhere
✅ **No app store** - Deploy instantly, no approval needed

This setup gives you a production-ready, mobile-friendly IoT monitoring system! 🚀
