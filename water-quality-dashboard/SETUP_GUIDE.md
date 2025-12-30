# Quick Setup Guide - Water Quality Dashboard

## ✅ What's Already Done

- ✅ ESP32 firmware configured and uploading data
- ✅ GCP VM with MQTT broker running
- ✅ Python bridge script forwarding data to Supabase
- ✅ React PWA dashboard created and running

## 🔧 Final Configuration Step

### Configure Dashboard to Connect to Supabase

1. **Get your Supabase credentials:**
   - Go to https://app.supabase.com
   - Select your project
   - Navigate to: **Settings** → **API**
   - Copy these two values:
     - **Project URL** (looks like: `https://xxxxx.supabase.co`)
     - **Anon/Public Key** (long string starting with `eyJ...`)

2. **Update the `.env` file:**

Open `water-quality-dashboard\.env` and paste your credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Restart the dev server:**

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

4. **Open the dashboard:**

Navigate to: http://localhost:5173

## 🎉 Expected Result

You should see:
- ✅ Live sensor readings updating in real-time
- ✅ Historical charts showing trends
- ✅ Alerts panel (if any thresholds are exceeded)
- ✅ "Last Update" timestamp changing automatically

## 📊 Dashboard Features

### Metric Cards
- Show current values for all 5 parameters
- Color-coded status (green = safe, red = danger)
- Threshold ranges displayed

### Charts
- Temperature & pH trends
- Dissolved Oxygen & Ammonia trends
- Interactive hover tooltips

### Alert Panel
- Shows active alerts when parameters exceed thresholds
- "System Healthy" message when all is normal

## 🔄 Real-time Updates

The dashboard automatically updates when:
- ESP32 publishes new sensor data
- No manual refresh needed!
- Updates appear within 1-2 seconds

## 🚀 Next Steps (Optional)

### Deploy to Production
- Build: `npm run build`
- Deploy to Vercel/Netlify for free hosting
- Access from anywhere with internet

### Add PWA Features
- Service worker for offline support
- "Add to Home Screen" on mobile
- Push notifications for alerts

### Enhance Functionality
- Export data to CSV/Excel
- Email/SMS alerts
- Multi-device support

## 📝 Notes

- **Current interval:** ESP32 publishes every 60 seconds (for testing)
- **Production interval:** Change to 6 hours in ESP32 code (line 36)
- **Data retention:** Last 50 readings displayed on charts
- **Cost:** $0/month using free tiers

## 🆘 Troubleshooting

### Dashboard shows "--" for all values
- Check that ESP32 is powered and connected to WiFi
- Verify Python bridge script is running on VM
- Confirm Supabase credentials in `.env` are correct

### Charts not showing
- Need at least 2 data points for charts to render
- Wait for ESP32 to publish 2+ readings

### Real-time updates not working
- Check browser console for errors
- Verify Supabase real-time is enabled
- Refresh the page

---

**Dashboard is ready to use!** 🎉
