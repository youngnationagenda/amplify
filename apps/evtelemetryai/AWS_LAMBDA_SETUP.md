# AWS Lambda Setup Guide

This guide covers setting up AWS Lambda to handle the `/api/analyze` endpoint for your EV Telemetry AI application.

## Architecture

```
React App (S3) → AWS Lambda (API) → Google GenAI → Analysis Result
                 (via API Gateway)
```

## Prerequisites

- AWS Account
- Google GenAI API key (from https://aistudio.google.com/app/apikeys)
- AWS CLI configured (optional)
- Your AWS credentials already added to GitHub Secrets

---

## Step 1: Create Lambda Function

### Via AWS Console:

1. Go to **AWS Lambda → Create Function**
2. **Function name:** `evtelemetryai-analyze`
3. **Runtime:** Node.js 20.x
4. **Architecture:** x86_64
5. **Execution role:** Create new role with basic Lambda permissions
6. Click **Create Function**

### Permissions Setup:

The default execution role should have:
- `AWSLambdaBasicExecutionRole` (for CloudWatch logs)
- No need for S3 or other AWS service permissions

---

## Step 2: Add Code to Lambda

### Option A: Upload via AWS Console (Easiest)

1. In Lambda console, click **Code** tab
2. Replace the default code with the content from `lambda/analyze.js` (in this repo)
3. Click **Deploy**

### Option B: Deploy via AWS CLI

```bash
cd lambda

# Install dependencies
npm install

# Create deployment package
zip -r function.zip .

# Update Lambda function
aws lambda update-function-code \
  --function-name evtelemetryai-analyze \
  --zip-file fileb://function.zip \
  --region us-east-1
```

---

## Step 3: Set Environment Variables

### In AWS Lambda Console:

1. Go to your Lambda function
2. Click **Configuration** tab
3. Click **Environment variables** on the left
4. Click **Edit**
5. Click **Add environment variable**
6. Enter:
   - **Key:** `GOOGLE_GENAI_API_KEY`
   - **Value:** Your Google GenAI API key (from https://aistudio.google.com/app/apikeys)
7. Click **Save**

⚠️ **Keep your API key secret!** AWS encrypts it automatically.

### Verify it was saved:

```bash
aws lambda get-function-configuration \
  --function-name evtelemetryai-analyze \
  --region us-east-1 | grep -A5 Environment
```

---

## Step 4: Increase Lambda Timeout

AI analysis can take time. Increase timeout:

1. In Lambda console, click **Configuration** tab
2. Click **General configuration** on the left
3. Click **Edit**
4. Set **Timeout** to `60 seconds` (max for synchronous calls)
5. Set **Memory** to `512 MB` or higher (optional, default is 128MB)
6. Click **Save**

---

## Step 5: Create API Gateway

To expose Lambda as an HTTP endpoint:

### Create API:

1. Go to **API Gateway → APIs**
2. Click **Create API**
3. Choose **REST API** (not HTTP API)
4. **API name:** `evtelemetryai-api`
5. **Description:** EV Telemetry AI Analysis API
6. **Endpoint type:** Regional
7. Click **Create API**

### Create Resource:

1. Click on **Resources** (left sidebar)
2. Right-click on `/` (root) → **Create Resource**
3. **Resource name:** `analyze`
4. **Resource path:** `analyze` (should auto-fill)
5. ✅ **Check** "Enable API Gateway CORS"
6. Click **Create Resource**

### Create POST Method:

1. Select the `/analyze` resource (if not already selected)
2. Click **Create method** → **POST**
3. **Integration type:** Lambda Function
4. **Lambda Function:** `evtelemetryai-analyze`
5. ✅ **Check** "Use Lambda Proxy integration"
6. Click **Create method**

### Enable CORS:

1. Select `/analyze` resource
2. Click **Actions** dropdown → **Enable CORS**
3. Check all methods: `POST`, `OPTIONS`, `GET` (optional)
4. Click **Enable CORS and replace existing CORS headers**
5. Confirm the popup

### Deploy API:

1. Click **Actions** dropdown → **Deploy API**
2. **Deployment stage:** Create new stage
3. **Stage name:** `prod`
4. **Stage description:** Production
5. Click **Deploy**

### Get Your API Endpoint:

After deployment, you'll see:
```
Invoke URL: https://{api-id}.execute-api.us-east-1.amazonaws.com/prod
```

Your analyze endpoint is:
```
https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/analyze
```

**Save this URL** — you'll need it in the next step!

---

## Step 6: Update React App

Now update your React code to call the Lambda API:

### Update `services/aiService.ts`:

```typescript
import { DailySummary, RiderProfile, RideData } from '../types';

export interface RealtimeMetrics {
  // ... keep existing interface
}

export const generateRealtimeMetrics = async (rides: RideData[]): Promise<RealtimeMetrics | null> => {
  // ... keep existing function
};

/**
 * Perform a deep audit of the fleet's performance and carbon credits.
 * Calls AWS Lambda /api/analyze endpoint for secure AI analysis.
 */
export const analyzeFleetPerformance = async (
    summaries: DailySummary[],
    riders: RiderProfile[],
    dateRange?: { start: string; end: string }
): Promise<string> => {
    
    try {
        // Get Lambda API endpoint from environment or use default
        const apiEndpoint = import.meta.env.VITE_LAMBDA_API_ENDPOINT 
            || 'https://{api-id}.execute-api.us-east-1.amazonaws.com/prod';
        
        const response = await fetch(`${apiEndpoint}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                summaries,
                riders,
                dateRange
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const result = await response.json();
        return result.analysis || "Analysis complete but no text returned.";

    } catch (error) {
        console.error("AI Analysis Error:", error);
        return `Failed to generate analysis: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`;
    }
};
```

### Add Environment Variable:

Update your `.env.example`:

```
# AWS Lambda API Endpoint for AI Analysis
VITE_LAMBDA_API_ENDPOINT=https://{api-id}.execute-api.us-east-1.amazonaws.com/prod
```

Update your `.env` (local):

```
VITE_LAMBDA_API_ENDPOINT=https://{your-actual-api-id}.execute-api.us-east-1.amazonaws.com/prod
```

**Replace `{api-id}` with your actual API ID from Step 5!**

---

## Step 7: Build and Deploy

Now deploy your updated React app:

```bash
# Build React app
npm run build

# Push to GitHub (GitHub Actions will auto-deploy to S3)
git add .
git commit -m "Update aiService to call AWS Lambda API endpoint"
git push origin main

# Watch GitHub Actions deploy
# Go to: https://github.com/youngnationagenda/EVtelemetryAI/actions
```

---

## Testing

### Test 1: Direct Lambda Test

In Lambda console:

1. Go to your Lambda function
2. Click **Test** tab
3. Create new test event:

```json
{
  "requestContext": {
    "http": {
      "method": "POST"
    }
  },
  "body": "{\"summaries\": [{\"date\": \"2026-06-09\", \"total_rides\": 10}], \"riders\": [{\"rider_id\": \"RID-KE-00001\", \"total_carbon_kg\": 100, \"total_distance_km\": 150}], \"dateRange\": {\"start\": \"2026-06-01\", \"end\": \"2026-06-09\"}}"
}
```

4. Click **Test**
5. You should see a successful response with analysis

### Test 2: Via cURL

```bash
curl -X POST https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "summaries": [{"date": "2026-06-09", "total_rides": 10}],
    "riders": [{"rider_id": "RID-KE-00001", "total_carbon_kg": 100, "total_distance_km": 150}],
    "dateRange": {"start": "2026-06-01", "end": "2026-06-09"}
  }'
```

### Test 3: From React App

1. Visit `https://evtelemetryai.yna.co.ke`
2. Navigate to **AI Analyst** tab
3. Select a date range
4. Click **Analyze**
5. Wait for analysis to complete
6. Check browser DevTools (F12) → **Network** tab for the API call

Expected response:
```json
{
  "success": true,
  "analysis": "## Fleet Performance Analysis\n\n### Key Findings\n..."
}
```

---

## Troubleshooting

### "Missing Authentication Token" (403 Forbidden)

**Problem:** API Gateway endpoint not deployed properly

**Solution:**
1. Go to **API Gateway → APIs → evtelemetryai-api**
2. Go to **Stages → prod**
3. Look for **Invoke URL** — make sure it's showing
4. If not, re-deploy: **Actions → Deploy API → prod**

### "API Key not configured" Error

**Problem:** Lambda environment variable not set

**Solution:**
1. Go to **Lambda → evtelemetryai-analyze**
2. Click **Configuration → Environment variables**
3. Verify `GOOGLE_GENAI_API_KEY` is present
4. If not, add it (see Step 3)
5. Click **Deploy** on Lambda

### "Timeout" (504 Gateway Timeout)

**Problem:** Lambda takes too long

**Solution:**
1. Increase Lambda timeout to 60 seconds (see Step 4)
2. Check Lambda logs in CloudWatch for errors
3. Consider increasing memory to 512MB or 1024MB

### "CORS Error in Browser"

**Problem:** Browser blocks API call due to CORS

**Solution:**
1. Go to **API Gateway → APIs → evtelemetryai-api**
2. Select `/analyze` resource
3. Click **Actions → Enable CORS**
4. Re-deploy: **Actions → Deploy API → prod**

### "Method Not Allowed" (405)

**Problem:** POST method not created for `/analyze`

**Solution:**
1. Go to **API Gateway → Resources → /analyze**
2. Verify **POST** method exists (should show in dropdown)
3. If missing, create it: **Create method → POST**
4. Point to Lambda: `evtelemetryai-analyze`
5. Deploy API

### Check Lambda Logs

View errors via CloudWatch:

```bash
# View logs
aws logs tail /aws/lambda/evtelemetryai-analyze --follow

# Or via AWS Console:
# CloudWatch → Logs → Log groups → /aws/lambda/evtelemetryai-analyze
```

### Test Lambda Directly

```bash
# Invoke Lambda from CLI
aws lambda invoke \
  --function-name evtelemetryai-analyze \
  --payload '{"requestContext":{"http":{"method":"POST"}},"body":"{\"summaries\":[],\"riders\":[]}"}' \
  response.json

# View response
cat response.json
```

---

## Monitoring & Debugging

### CloudWatch Dashboard

1. Go to **CloudWatch → Dashboards**
2. Create new dashboard: `evtelemetryai-monitoring`
3. Add widgets:
   - Lambda **Invocations** (count)
   - Lambda **Errors** (count)
   - Lambda **Duration** (average)
   - API Gateway **Count** (requests)
   - API Gateway **4XXError** (client errors)
   - API Gateway **5XXError** (server errors)

### View Lambda Metrics

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=evtelemetryai-analyze \
  --start-time 2026-06-08T00:00:00Z \
  --end-time 2026-06-09T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

---

## Cost Estimation

**Monthly costs (approximate):**

| Service | Usage | Cost |
|---------|-------|------|
| Lambda | 1M invocations | ~$0.20 |
| API Gateway | 1M requests | ~$3.50 |
| Google GenAI | Depends on plan | Varies |
| S3 | Storage + requests | ~$1-5 |
| CloudFront | Data transfer | Varies |
| **Total** | | ~$5-100/month |

**Free tier:**
- Lambda: 1M invocations/month
- API Gateway: 1M requests/month
- S3: 5GB storage

---

## Security Best Practices

1. ✅ **API Key in Lambda Environment** — Never in client code
2. ✅ **API Gateway Throttling** — Add rate limiting to prevent abuse
3. ✅ **CORS Restricted** — Only allow your domain
4. ✅ **HTTPS Only** — API Gateway uses HTTPS by default
5. ✅ **CloudWatch Logs** — Monitor for suspicious activity
6. ✅ **AWS IAM Roles** — Lambda has minimal permissions

### Add Rate Limiting (Optional):

1. Go to **API Gateway → APIs → evtelemetryai-api**
2. Click **Stages → prod**
3. Go to **Throttle settings**
4. Set **Throttle rate:** 2 requests/second
5. Set **Burst limit:** 10 requests
6. Click **Save**

---

## Next Steps

1. ✅ Create Lambda function
2. ✅ Set up API Gateway
3. ✅ Add environment variables
4. ✅ Update React app
5. ✅ Deploy to S3 via GitHub Actions
6. ✅ Test end-to-end
7. Monitor logs in CloudWatch

---

## Quick Checklist

- [ ] Lambda function created (`evtelemetryai-analyze`)
- [ ] Environment variable set (`GOOGLE_GENAI_API_KEY`)
- [ ] Lambda timeout increased to 60 seconds
- [ ] API Gateway created (`evtelemetryai-api`)
- [ ] `/analyze` resource created with POST method
- [ ] CORS enabled on API Gateway
- [ ] API deployed to `prod` stage
- [ ] React app updated with Lambda API endpoint
- [ ] `.env` updated with `VITE_LAMBDA_API_ENDPOINT`
- [ ] GitHub Actions workflow created
- [ ] AWS secrets added to GitHub
- [ ] Code pushed to GitHub
- [ ] GitHub Actions deployed to S3
- [ ] CloudFront cache invalidated
- [ ] Website tested at `https://evtelemetryai.yna.co.ke`

---

## Support & Resources

- **AWS Lambda Docs:** https://docs.aws.amazon.com/lambda/
- **API Gateway Docs:** https://docs.aws.amazon.com/apigateway/
- **Google GenAI Docs:** https://ai.google.dev/
- **CloudWatch Logs:** https://docs.aws.amazon.com/AmazonCloudWatch/

---

**Your API is now serverless, scalable, and production-ready!** 🚀
