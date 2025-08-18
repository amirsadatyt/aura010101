
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

    // Query the 'spent_banknotes' table
    const { data, error } = await supabase
      .from('spent_banknotes')
      .select('serial_number') // We only need to select one column to see if a row exists
      .eq('serial_number', serial); // Filter for rows where the serial_number matches

    // If there was an error with the database query, send an error response
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // If the 'data' array has one or more items, it means the serial was found
    const hasBeenSpent = data && data.length > 0;

    // Send a success response back to the wallet
    return res.status(200).json({ hasBeenSpent });
  } else {
    // If the request is not a POST, return an error
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
