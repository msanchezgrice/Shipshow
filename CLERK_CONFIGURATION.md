# 📋 Clerk Dashboard Configuration Guide for shipshow.io

## ✅ Step 1: Paths Configuration

Go to your Clerk Dashboard → **Paths** section and configure:

### Home URL
```
https://shipshow.io
```

### Unauthorized Sign-in URL
```
https://shipshow.io/sign-in
```

### Component Paths

#### <SignIn />
- Select: **"Sign-in page on application domain"**
- URL: `https://shipshow.io/sign-in`

#### <SignUp />
- Select: **"Sign-up page on application domain"**
- URL: `https://shipshow.io/sign-up`

#### Signing Out
- Select: **"Path on application domain"**
- URL: `https://shipshow.io`

## ✅ Step 2: Account Portal → Redirects

### User Redirects
Configure these redirect URLs:

#### After sign-up fallback
```
https://shipshow.io/dashboard
```

#### After sign-in fallback
```
https://shipshow.io/dashboard
```

#### After logo click
```
https://shipshow.io
```

## ✅ Step 3: Webhooks Configuration (CRITICAL)

Go to **Webhooks** in your Clerk Dashboard:

### 1. Click "Add Endpoint"

### 2. Configure the webhook:
- **Endpoint URL**: `https://shipshow.io/api/webhooks/clerk`
- **Description**: User sync with database

### 3. Select Events to Listen For:
Check these events:
- ✅ `user.created`
- ✅ `user.updated`
- ✅ `user.deleted`

### 4. Copy the Signing Secret
After creating the webhook, you'll see a **Signing Secret**. Copy it!

### 5. Add to Vercel Environment Variables
```bash
vercel env add CLERK_WEBHOOK_SECRET production
# Paste the signing secret when prompted
```

## ✅ Step 4: Environment Variables

Make sure these are all set in Vercel:

```env
# Required - Already Set
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Required - Paths (These are automatic from Dashboard)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Required - Add This One
CLERK_WEBHOOK_SECRET=whsec_... (from webhook setup)

# Database - Already Updated
DATABASE_URL=postgresql://...?sslmode=require&pgbouncer=true
```

## ⚠️ Issues Found & Fixed

### 1. ✅ FIXED: Missing Webhook Endpoint
- Created `/api/webhooks/clerk/route.ts` to sync users with database
- This ensures user data is saved when they sign up

### 2. ✅ FIXED: Incorrect Path Configuration
- Sign-in/Sign-up paths should use application domain, not Account Portal
- After sign-in/sign-up should redirect to `/dashboard`

### 3. ⚠️ ACTION REQUIRED: Database Schema
- You still need to run `supabase_schema.sql` in your Supabase Dashboard

## 🔍 Testing Checklist

After configuration:

1. **Test Sign Up Flow**:
   - Go to `https://shipshow.io/sign-up`
   - Create a new account
   - Should redirect to `/dashboard`
   - Check Supabase: User should appear in "User" table

2. **Test Sign In Flow**:
   - Sign out
   - Go to `https://shipshow.io/sign-in`
   - Sign in with existing account
   - Should redirect to `/dashboard`

3. **Test Sign Out**:
   - Click sign out
   - Should redirect to homepage `/`

4. **Test Webhook**:
   - Check Clerk Dashboard → Webhooks → Your endpoint
   - Look for successful delivery logs

## 📱 Optional: Social Login

If you want to enable social logins (Google, GitHub, etc.):

1. Go to **User & Authentication** → **Social Connections**
2. Enable desired providers
3. Configure OAuth apps for each provider
4. No code changes needed - Clerk handles it automatically!

## 🚨 Important Notes

1. **Database Schema**: The `User` table in Supabase MUST have:
   - `id` (text) - matches Clerk user ID
   - `handle` (text) - unique username
   - `name` (text) - full name
   - `avatarUrl` (text) - profile image

2. **Webhook Secret**: Never commit `CLERK_WEBHOOK_SECRET` to git!

3. **Testing**: Always test in incognito/private mode to avoid cached sessions

## 🎯 Quick Verification

Run this to verify your setup:
```bash
# Check environment variables
vercel env ls

# You should see:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY  
# - CLERK_WEBHOOK_SECRET
# - DATABASE_URL
```

## 📝 Summary

Your application flow:
1. User visits `shipshow.io`
2. Clicks "Sign up" → goes to `/sign-up`
3. Creates account → Clerk sends webhook to `/api/webhooks/clerk`
4. Webhook creates user in Supabase
5. User redirected to `/dashboard`
6. User can create projects, manage profile, etc.
7. Sign out → returns to homepage
