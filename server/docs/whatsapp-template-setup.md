# WhatsApp Business API - Simple Template Setup

## Template to Create in Meta Business Manager

### Template Name: `payment_reminder_simple`

**Category:** UTILITY

**Language:** English

**Template Content:**

```
Body:
Hi! Fee payment reminder for {{1}}.
Amount due: ₹{{2}}

Please pay at your earliest convenience.

Thank you!
```

**Variables:**
- `{{1}}` = Student name
- `{{2}}` = Amount

---

## How to Create Template in Meta Business Manager

1. **Go to Meta Business Manager**
   - URL: https://business.facebook.com/
   - Login with your Facebook account

2. **Navigate to WhatsApp Manager**
   - Click on "WhatsApp Accounts" in left menu
   - Select your WhatsApp Business Account

3. **Go to Message Templates**
   - Click "Message templates" in left sidebar
   - Click "Create template" button

4. **Fill in Template Details**
   - **Name:** `payment_reminder_simple`
   - **Category:** Select "UTILITY"
   - **Languages:** Select "English"

5. **Create Template Body**
   - In the body section, paste:
     ```
     Hi! Fee payment reminder for {{1}}.
     Amount due: ₹{{2}}

     Please pay at your earliest convenience.

     Thank you!
     ```
   - Click "Add sample" to add sample values:
     - Variable 1: "Rahul Kumar"
     - Variable 2: "500"

6. **Submit for Approval**
   - Click "Submit"
   - Approval typically takes 24-48 hours
   - You'll receive email notification when approved

---

## Environment Variables Needed

Add these to your `.env` file:

```env
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
```

You mentioned you already have Phone Number ID and Access Token - add them to the `.env` file!

---

## Testing

Once the template is approved, we can test sending messages from the dashboard or via automated reminders.
