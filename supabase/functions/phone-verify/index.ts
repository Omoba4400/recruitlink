/// <reference types="https://deno.land/x/types/index.d.ts" />

// @deno-types="npm:@types/node"

// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Twilio } from 'https://esm.sh/twilio@4.19.0'

serve(async (req) => {
  // Handle CORS
  const origin = req.headers.get('origin') || 'http://localhost:3000';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400' // 24 hours
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { action, phoneNumber, code } = await req.json()
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const serviceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID')

    if (!accountSid || !authToken || !serviceSid) {
      throw new Error('Missing Twilio credentials')
    }

    const client = new Twilio(accountSid, authToken)

    if (action === 'send') {
      // Send verification code
      const verification = await client.verify.v2
        .services(serviceSid)
        .verifications.create({ to: phoneNumber, channel: 'sms' })

      return new Response(
        JSON.stringify({ success: true, status: verification.status }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'verify') {
      // Verify the code
      const verificationCheck = await client.verify.v2
        .services(serviceSid)
        .verificationChecks.create({ to: phoneNumber, code })

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: verificationCheck.status,
          valid: verificationCheck.status === 'approved'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      throw new Error('Invalid action')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 