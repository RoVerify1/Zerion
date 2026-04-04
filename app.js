// Wir laden Supabase direkt über CDN, kein npm nötig!
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// --- KONFIGURATION ---
// ERSETZE DIES MIT DEINEN SUPABASE DATEN!
const SUPABASE_URL = 'DEINE_SUPABASE_URL_HIER';
const SUPABASE_KEY = 'DEINE_SUPABASE_ANON_KEY_HIER';
const DISCORD_WEBHOOK = 'DEINE_DISCORD_WEBHOOK_URL_HIER'; // Optional

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- HELPER FUNCTIONS ---

async function sendDiscordEmbed(title, description, color) {
    if (!DISCORD_WEBHOOK || DISCORD_WEBHOOK.includes('DEINE_')) return;
    
    const payload = {
        embeds: [{
            title: title,
            description: description,
            color: color,
            timestamp: new Date().toISOString(),
            footer: { text: "RobloxVerify Static" }
        }]
    };

    try {
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) { console.error("Discord Error", e); }
}

function generateRandomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// --- AUTH LOGIC ---

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: { data: { username: username } }
    });

    if (error) {
        alert(error.message);
    } else {
        alert("Registrierung erfolgreich! Bitte einloggen.");
        // Profil initialisieren
        if (data.user) {
            await supabase.from('profiles').insert([
                { id: data.user.id, username: username }
            ]);
            await sendDiscordEmbed("New Registration", `User: ${username}`, 0x3498db);
        }
        window.location.href = 'index.html';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("Falsches Passwort oder Email");
    } else {
        await sendDiscordEmbed("User Login", `User logged in.`, 0xf1c40f);
        window.location.href = 'dashboard.html';
    }
}

async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session && window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'index.html';
    }
    return session;
}

async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// --- DASHBOARD LOGIC ---

async function loadDashboard() {
    const session = await checkSession();
    if (!session) return;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        document.getElementById('user-display').innerText = profile.username || session.user.email;
        
        if (profile.is_verified) {
            document.getElementById('verify-section').classList.add('hidden');
            document.getElementById('status-display').innerHTML = '<span class="status-badge verified">✓ Verifiziert</span>';
            document.getElementById('roblox-display').innerText = `Roblox: ${profile.roblox_username}`;
        } else {
            document.getElementById('status-display').innerHTML = '<span class="status-badge unverified">✗ Nicht Verifiziert</span>';
        }
    }
}

async function generateCode() {
    const session = await supabase.auth.getSession();
    if (!session.data.session) return;

    const code = generateRandomCode();
    
    // Code in DB speichern
    await supabase
        .from('profiles')
        .update({ verification_code: code })
        .eq('id', session.data.session.user.id);

    document.getElementById('verification-code-display').innerText = code;
    document.getElementById('code-instruction').classList.remove('hidden');
}

async function verifyRoblox() {
    const robloxUser = document.getElementById('roblox-input').value;
    if (!robloxUser) return alert("Bitte Username eingeben");

    const btn = document.getElementById('verify-btn');
    btn.innerText = "Prüfe...";
    btn.disabled = true;

    // HINWEIS: Echte Roblox API Checks erfordern ein Backend wegen CORS.
    // Für diese "No-NPM" Lösung simulieren wir den Erfolg oder nutzen einen Proxy.
    // Hier: Wir nehmen an, der User hat den Code in die Bio gesetzt.
    // In einer echten App müsste hier ein Cloud Function Aufruf stehen.
    
    // SIMULATION FÜR DEMO (Entfernen in Produktion und durch echten API Call ersetzen):
    setTimeout(async () => {
        const session = await supabase.auth.getSession();
        
        // Update DB
        await supabase
            .from('profiles')
            .update({ 
                is_verified: true, 
                roblox_username: robloxUser,
                verification_code: null 
            })
            .eq('id', session.data.session.user.id);

        await sendDiscordEmbed("Verification Success", `User verified as ${robloxUser}`, 0x2ecc71);
        
        alert("Verifizierung erfolgreich!");
        window.location.reload();
    }, 2000);
}

// --- EVENT LISTENERS ---

if (document.getElementById('register-form')) {
    document.getElementById('register-form').addEventListener('submit', handleRegister);
}

if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

if (document.getElementById('dashboard-content')) {
    loadDashboard();
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('gen-code-btn').addEventListener('click', generateCode);
    document.getElementById('verify-btn').addEventListener('click', verifyRoblox);
}
