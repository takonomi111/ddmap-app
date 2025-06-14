import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://panzxspmshzqdvyrpyzx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbnp4c3Btc2h6cWR2eXJweXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzEyNTIsImV4cCI6MjA2NTQwNzI1Mn0.bQFFpWI_sAMiU3_EUw1WokiHv6N80gCa2hQo59bo6d0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
