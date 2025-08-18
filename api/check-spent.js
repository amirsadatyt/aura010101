import { createClient } from '@supabase/supabase-js';

// Securely get your Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// This is the main serverless function
export default async function handler(req, res) {
  // === CORS HEADERS START ===
  // These headers give permission for your wallet app to call this API
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allows requests from any origin
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle the browser's pre-flight "OPTIONS" request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // === CORS HEADERS END ===

  // We only want to allow POST requests for the actual logic
  if (req.method === 'POST') {
    const { serial } = req.body;

    const { data, error } = await supabase
      .from('spent_banknotes')
      .select('serial_number')
      .eq('serial_number', serial);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const hasBeenSpent = data && data.length > 0;
    return res.status(200).json({ hasBeenSpent });
  } else {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
