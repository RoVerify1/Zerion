import { createClient } from '@supabase/supabase-client';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    const { code } = req.query;
    const { data, error } = await supabase
        .from('roblox_scripts')
        .select('script_content')
        .eq('connection_code', code)
        .single();

    if (error || !data) return res.status(404).json({ message: "Nicht gefunden" });
    res.status(200).json(data);
}
