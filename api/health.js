export default async function handler(_req, res) {
  const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  return res.status(200).json({
    ok: true,
    service: 'border-of-evidence-vercel-api',
    timestamp: new Date().toISOString(),
    supabaseConfigured: hasSupabase,
    geminiConfigured: hasGemini,
  });
}
