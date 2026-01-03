#!/usr/bin/env python3
"""
Email Notification Module for Water Quality Alerts
Uses Resend API to send push email alerts when thresholds are exceeded.
"""

import os
import time
from datetime import datetime
from typing import Optional

try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    print("⚠️  Resend not installed. Email notifications disabled.")
    print("   Install with: pip install resend")


class EmailNotifier:
    """Handles email notifications for water quality alerts using Resend."""
    
    # Rate limiting: minimum seconds between emails for the same parameter
    DEFAULT_COOLDOWN = 300  # 5 minutes
    
    # Parameter-specific recommendations
    RECOMMENDATIONS = {
        'temperature': {
            'high': 'Consider increasing water flow or adding shade covers to reduce temperature.',
            'low': 'Check heating systems and ensure proper insulation.'
        },
        'ph': {
            'high': 'Add pH-lowering agents or increase aeration. Check for algae blooms.',
            'low': 'Add pH buffer or lime. Check for organic matter decomposition.'
        },
        'dissolved_oxygen': {
            'high': 'Reduce aeration if levels are excessively high.',
            'low': 'URGENT: Increase aeration immediately! Check for equipment failures.'
        },
        'ammonia': {
            'high': 'CRITICAL: Reduce feeding, increase water exchange, check filtration system!',
            'low': 'Ammonia levels are within safe range.'
        },
        'salinity': {
            'high': 'Add freshwater to reduce salinity levels.',
            'low': 'Add salt or reduce freshwater input to maintain proper salinity.'
        }
    }
    
    def __init__(self):
        self.api_key = os.getenv('RESEND_API_KEY')
        self.to_email = os.getenv('ALERT_EMAIL_TO')
        self.from_email = os.getenv('ALERT_EMAIL_FROM', 'Water Quality Alerts <onboarding@resend.dev>')
        self.cooldown = int(os.getenv('EMAIL_COOLDOWN_SECONDS', self.DEFAULT_COOLDOWN))
        
        # Track last email sent time per parameter to prevent spam
        self._last_sent = {}
        
        # Settings from Supabase (can be toggled from dashboard)
        self._db_enabled = True  # Default to enabled
        self._db_recipient = None
        self._db_cooldown = None
        self._settings_loaded = False
        
        if not RESEND_AVAILABLE:
            self.enabled = False
            return
            
        if not self.api_key:
            print("⚠️  RESEND_API_KEY not set. Email notifications disabled.")
            self.enabled = False
            return
        
        # Configure Resend
        resend.api_key = self.api_key
        self.enabled = True
        
        # Try to load settings from Supabase
        self._load_db_settings(verbose=True)
        
        if self.enabled:
            recipient = self._get_recipient()
            if recipient:
                print(f"✅ Email notifications enabled. Alerts will be sent to: {recipient}")
            else:
                print("⚠️  No recipient email configured. Set ALERT_EMAIL_TO or configure in dashboard.")
    
    def _load_db_settings(self, verbose=False):
        """Load email settings from Supabase database.
        
        Args:
            verbose: If True, print status messages. False by default to reduce spam.
        """
        try:
            # Import supabase client
            from supabase import create_client
            
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_KEY")
            
            if not supabase_url or not supabase_key:
                return False
            
            # Create client (could cache this but keep simple for now)
            client = create_client(supabase_url, supabase_key)
            result = client.table('email_settings').select('*').limit(1).execute()
            
            if result.data and len(result.data) > 0:
                settings = result.data[0]
                old_enabled = self._db_enabled
                
                self._db_enabled = settings.get('enabled', True)
                self._db_recipient = settings.get('recipient_email')
                self._db_cooldown = settings.get('cooldown_seconds')
                self._settings_loaded = True
                
                # Only log when settings change
                if verbose or old_enabled != self._db_enabled:
                    if not self._db_enabled:
                        print("📧 Email notifications DISABLED via dashboard")
                    else:
                        print(f"📧 Email notifications ENABLED → {self._db_recipient or self.to_email}")
                
                return True
                    
        except Exception as e:
            if verbose:
                print(f"📧 Using env settings (DB unavailable: {type(e).__name__})")
            return False
    
    def _get_recipient(self) -> Optional[str]:
        """Get recipient email, preferring DB settings over env var."""
        if self._db_recipient:
            return self._db_recipient
        return self.to_email
    
    def _get_cooldown(self) -> int:
        """Get cooldown period, preferring DB settings over env var."""
        if self._db_cooldown:
            return self._db_cooldown
        return self.cooldown
    
    def _can_send(self, parameter: str) -> bool:
        """Check if enough time has passed since last email for this parameter."""
        last_time = self._last_sent.get(parameter, 0)
        cooldown = self._get_cooldown()
        return (time.time() - last_time) >= cooldown
    
    def _is_enabled(self) -> bool:
        """Check if email notifications are enabled (API + dashboard toggle)."""
        if not self.enabled:
            return False
        # Reload settings periodically to pick up dashboard changes
        self._load_db_settings()
        return self._db_enabled
    
    def _get_recommendation(self, parameter: str, value: float, min_val: float, max_val: float) -> str:
        """Get specific recommendation based on parameter and whether it's too high or low."""
        if parameter not in self.RECOMMENDATIONS:
            return "Please review the parameter and take appropriate action."
        
        if value < min_val:
            return self.RECOMMENDATIONS[parameter].get('low', 'Value is below safe range.')
        else:
            return self.RECOMMENDATIONS[parameter].get('high', 'Value is above safe range.')
    
    def _get_severity_color(self, severity: str) -> str:
        """Get color code for severity level."""
        colors = {
            'high': '#dc2626',    # Red
            'medium': '#f59e0b',  # Orange
            'low': '#eab308'      # Yellow
        }
        return colors.get(severity, '#6b7280')
    
    def _format_parameter_name(self, param: str) -> str:
        """Format parameter name for display."""
        names = {
            'temperature': 'Temperature',
            'ph': 'pH Level',
            'dissolved_oxygen': 'Dissolved Oxygen',
            'ammonia': 'Ammonia (NH₃)',
            'salinity': 'Salinity'
        }
        return names.get(param, param.replace('_', ' ').title())
    
    def _get_unit(self, param: str) -> str:
        """Get unit for parameter."""
        units = {
            'temperature': '°C',
            'ph': '',
            'dissolved_oxygen': 'mg/L',
            'ammonia': 'ppm',
            'salinity': 'ppt'
        }
        return units.get(param, '')
    
    def _build_html_email(self, parameter: str, value: float, min_val: float, 
                          max_val: float, severity: str, device_id: str) -> str:
        """Build professional HTML email template."""
        param_name = self._format_parameter_name(parameter)
        unit = self._get_unit(parameter)
        color = self._get_severity_color(severity)
        recommendation = self._get_recommendation(parameter, value, min_val, max_val)
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
             background-color: #f3f4f6; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); 
                    padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Water Quality Alert</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0;">
                Aquaculture Monitoring System
            </p>
        </div>
        
        <!-- Alert Badge -->
        <div style="padding: 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <span style="display: inline-block; background: {color}; color: white; 
                         padding: 6px 16px; border-radius: 20px; font-weight: 600; 
                         text-transform: uppercase; font-size: 14px;">
                {severity.upper()} SEVERITY
            </span>
        </div>
        
        <!-- Content -->
        <div style="padding: 24px;">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">
                {param_name} Out of Range
            </h2>
            
            <!-- Value Display -->
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; 
                        text-align: center; margin-bottom: 20px;">
                <div style="font-size: 36px; font-weight: 700; color: {color};">
                    {value} {unit}
                </div>
                <div style="color: #6b7280; margin-top: 8px;">
                    Safe Range: {min_val} - {max_val} {unit}
                </div>
            </div>
            
            <!-- Recommendation -->
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; 
                        padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <strong style="color: #92400e;">Recommended Action:</strong>
                <p style="color: #78350f; margin: 8px 0 0 0;">{recommendation}</p>
            </div>
            
            <!-- Details -->
            <table style="width: 100%; font-size: 14px; color: #6b7280;">
                <tr>
                    <td style="padding: 8px 0;"><strong>Device ID:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">{device_id}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Timestamp:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">{timestamp}</td>
                </tr>
            </table>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 16px; text-align: center; 
                    border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated alert from your Water Quality Monitoring System.
            </p>
        </div>
    </div>
</body>
</html>
"""
    
    def send_alert(self, parameter: str, value: float, min_val: float, 
                   max_val: float, severity: str, device_id: str = 'esp32-001') -> bool:
        """
        Send an email alert for a threshold breach.
        
        Returns True if email was sent, False otherwise.
        """
        # Check if enabled (including dashboard toggle)
        if not self._is_enabled():
            return False
        
        # Get recipient
        recipient = self._get_recipient()
        if not recipient:
            print("📧 No recipient email configured")
            return False
        
        # Check rate limit
        if not self._can_send(parameter):
            cooldown = self._get_cooldown()
            remaining = cooldown - (time.time() - self._last_sent.get(parameter, 0))
            print(f"📧 Email for {parameter} skipped (cooldown: {int(remaining)}s remaining)")
            return False
        
        try:
            param_name = self._format_parameter_name(parameter)
            unit = self._get_unit(parameter)
            
            # Build email
            html_body = self._build_html_email(
                parameter, value, min_val, max_val, severity, device_id
            )
            
            # Send via Resend
            response = resend.Emails.send({
                "from": self.from_email,
                "to": [recipient],
                "subject": f"⚠️ Water Quality Alert: {param_name} = {value}{unit}",
                "html": html_body
            })
            
            # Update rate limit tracker
            self._last_sent[parameter] = time.time()
            
            print(f"📧 Alert email sent for {parameter} → {recipient}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email alert: {e}")
            return False


# Global notifier instance
_notifier: Optional[EmailNotifier] = None


def get_notifier() -> EmailNotifier:
    """Get or create the global email notifier instance."""
    global _notifier
    if _notifier is None:
        _notifier = EmailNotifier()
    return _notifier


def send_alert_email(parameter: str, value: float, min_val: float, 
                     max_val: float, severity: str, device_id: str = 'esp32-001') -> bool:
    """Convenience function to send an alert email."""
    return get_notifier().send_alert(parameter, value, min_val, max_val, severity, device_id)


def send_test_email():
    """Send a test email to verify configuration."""
    print("\n🧪 Sending test email...")
    notifier = get_notifier()
    
    if not notifier.enabled:
        print("❌ Email notifications are not enabled. Check your configuration.")
        return False
    
    # Send test with sample data
    success = notifier.send_alert(
        parameter='temperature',
        value=35.5,
        min_val=26.0,
        max_val=32.0,
        severity='high',
        device_id='test-device'
    )
    
    if success:
        print("✅ Test email sent successfully!")
    else:
        print("❌ Failed to send test email.")
    
    return success


if __name__ == '__main__':
    # Allow running directly to test
    from dotenv import load_dotenv
    load_dotenv()
    send_test_email()
