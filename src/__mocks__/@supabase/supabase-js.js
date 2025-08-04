// src/__mocks__/@supabase/supabase-js.js
// Mock for @supabase/supabase-js module
// Context: Used by Jest to mock Supabase client

const { mockSupabaseClient } = require('../supabaseTestClient');

module.exports = {
  createClient: jest.fn(() => mockSupabaseClient)
};