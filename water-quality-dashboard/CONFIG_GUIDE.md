# Dashboard Configuration Guide

## Quick Start

1. **Get your Supabase credentials:**
   - Go to https://app.supabase.com
   - Select your project
   - Go to Settings → API
   - Copy the values below

2. **Fill in these values:**

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Save this file as `.env`** (remove the `.example` extension or create a new `.env` file)

4. **Run the dashboard:**
```bash
npm run dev
```

## Example (DO NOT USE THESE VALUES)
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjQzMjAwMCwiZXhwIjoxOTMxOTkyMDAwfQ.example_signature_here
```
