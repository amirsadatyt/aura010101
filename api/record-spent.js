
// Import the Supabase client library
import { createClient } from '@supabase/supabase-js';

// Securely get your Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Create a Supabase client that can interact with your database
const supabase = createClient(supabaseUrl, supabaseKey);

// This is the main serverless function that will run
export default async function handler(req, res) {
  // We only want to allow POST requests to this endpoint
  if (req.method === 'POST') {
    // Get the serial number from the request body sent by the wallet
    const { serial } = req.body;

    // Insert a new row into the 'spent_banknotes' table
    const { data, error } = await supabase
      .from('spent_banknotes')
      .insert([{ serial_number: serial }]);

    // If there was an error (e.g., the serial already exists), send an error response
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // If the insert was successful, send a success response back to the wallet
    return res.status(200).json({ success: true });
  } else {
    // If the request is not a POST, return an error
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
