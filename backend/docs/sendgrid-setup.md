# SendGrid Email Setup for MindLink

This guide will help you set up SendGrid for reliable email delivery in your MindLink application.

## Why SendGrid?

- **Better Deliverability**: Higher inbox placement rates than Gmail SMTP
- **Analytics**: Track opens, clicks, bounces, and spam reports
- **Scalability**: Send thousands of emails per month
- **Templates**: Advanced email template management
- **Reliability**: 99.95% uptime SLA

## Setup Steps

### 1. Create SendGrid Account

1. Go to [SendGrid.com](https://sendgrid.com/)
2. Sign up for a free account (100 emails/day free tier)
3. Verify your account via email

### 2. Create API Key

1. In SendGrid dashboard, go to **Settings** > **API Keys**
2. Click **Create API Key**
3. Choose **Restricted Access**
4. Give it a name like "MindLink Production"
5. Grant these permissions:
   - **Mail Send**: Full Access
   - **Template Engine**: Read Access (if using SendGrid templates)
   - **Stats**: Read Access (optional, for analytics)
6. Click **Create & View**
7. Copy the API key (starts with `SG.`)

### 3. Verify Sender Identity

**Option A: Single Sender Verification (Quick Setup)**
1. Go to **Settings** > **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email details:
   - From Name: "MindLink"
   - From Email: "noreply@yourdomain.com"
   - Reply To: "support@yourdomain.com"
4. Complete verification

**Option B: Domain Authentication (Recommended for Production)**
1. Go to **Settings** > **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter your domain (e.g., yourdomain.com)
4. Add the DNS records provided by SendGrid
5. Wait for verification (can take up to 48 hours)

### 4. Configure Environment Variables

Add to your `.env` file:

```bash
# SendGrid Configuration
SENDGRID_API_KEY="SG.your-api-key-here"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"

# Optional: Disable SMTP fallback in production
SENDGRID_FALLBACK_DISABLED="false"
```

### 5. Test Your Setup

Use the email test endpoint:

```bash
# Test email sending
curl -X POST http://localhost:3001/api/v1/email/test \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

## Advanced Features

### Email Templates (Optional)

SendGrid offers advanced template management:

1. Go to **Email API** > **Dynamic Templates**
2. Create templates with handlebars syntax
3. Use template IDs in your API calls

### Webhooks for Analytics

1. Go to **Settings** > **Mail Settings** > **Event Webhooks**
2. Add your webhook URL: `https://yourdomain.com/api/v1/webhooks/sendgrid`
3. Select events to track (delivered, opened, clicked, etc.)

### IP Warming (For High Volume)

If sending 50,000+ emails/month:
1. Purchase a dedicated IP
2. Gradually increase sending volume
3. Follow SendGrid's IP warming guidelines

## Monitoring & Analytics

### SendGrid Dashboard
- Monitor delivery rates
- Track email engagement
- View bounce and spam reports

### Application Logs
The application logs will show:
```
✅ SendGrid email sent successfully: { messageId: '...', to: '...', subject: '...' }
⚠️  SendGrid failed, falling back to SMTP: Rate limit exceeded
```

## Troubleshooting

### Common Issues

**1. API Key Invalid**
```
Error: Unauthorized
```
- Verify API key is correct
- Check API key permissions
- Ensure no extra spaces in .env file

**2. Sender Not Verified**
```
Error: The from address does not match a verified Sender Identity
```
- Complete sender verification process
- Use exact email from verification

**3. Rate Limit Exceeded**
```
Error: Rate limit exceeded
```
- Check your SendGrid plan limits
- Implement exponential backoff
- Consider upgrading plan

**4. Domain Authentication Issues**
```
Warning: Email may go to spam
```
- Complete domain authentication
- Add SPF, DKIM, and DMARC records
- Monitor sender reputation

### Fallback Behavior

The system automatically falls back to SMTP if SendGrid fails:

1. **SendGrid** (Primary) - Best deliverability
2. **SMTP** (Fallback) - Gmail or custom SMTP
3. **Ethereal** (Development) - Test emails only

## Production Checklist

- [ ] SendGrid account created and verified
- [ ] API key created with correct permissions
- [ ] Domain authentication completed
- [ ] Sender identity verified
- [ ] Environment variables configured
- [ ] Test emails sent successfully
- [ ] Monitoring and alerting set up
- [ ] Backup SMTP configured (optional)

## Support

- **SendGrid Support**: [support.sendgrid.com](https://support.sendgrid.com)
- **Documentation**: [docs.sendgrid.com](https://docs.sendgrid.com)
- **Status Page**: [status.sendgrid.com](https://status.sendgrid.com)

## Cost Estimation

| Plan | Emails/Month | Price |
|------|--------------|-------|
| Free | 100/day | $0 |
| Essentials | 50,000 | $19.95 |
| Pro | 1,500,000 | $89.95 |

For MindLink's typical usage (welcome emails, password resets, appointment reminders), the Free tier should be sufficient during development, with Essentials for production.
