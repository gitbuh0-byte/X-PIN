# Vercel Environment Variables Setup

## Issue
The app requires Supabase environment variables to be prefixed with `VITE_` to be accessible to the frontend Vite build.

## Required Variables for Vercel

Add these to your Vercel project settings at:
`https://vercel.com/gitbuh0-byte/x-pin/settings/environment-variables`

### 1. Supabase Configuration
| Variable Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://qzbrjqgdlnkhixzwweri.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_h_kML0TrDVbNxPA2aL8eXw_sbUglfzB` |

### 2. Optional: Gemini API
| Variable Name | Value |
|---|---|
| `VITE_GEMINI_API_KEY` | Your Gemini API key (if using AI features) |

## Steps to Add Variables

1. Go to: https://vercel.com/gitbuh0-byte/x-pin/settings/environment-variables
2. Click "Add Environment Variable"
3. For each variable:
   - **Name**: Enter the variable name (with `VITE_` prefix)
   - **Value**: Enter the corresponding value
   - **Environments**: Select "Production" and "Preview"
4. Click "Save"
5. Trigger a redeploy in Vercel (or push a new commit to main)

## Important Notes
- Variables MUST have the `VITE_` prefix to be exposed to the frontend
- Variables without `VITE_` prefix are only available to backend/serverless functions
- Changes take effect after redeployment
