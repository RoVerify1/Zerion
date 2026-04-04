-- ⚙️ RoVerify - Konfiguration
-- Dieses File wird vom Haupt-Script geladen

local Config = {}

-- 🔥 WICHTIG: Deine Vercel/Website Domain
Config.API_BASE = "https://block-verify-com.vercel.app/"

-- 🔐 Game-Signatur (geheim! Muss mit Backend übereinstimmen)
-- Generiere einen zufälligen String: https://www.random.org/strings/
Config.GAME_SIGNATURE = "6135415383"

-- 🎁 Belohnungen nach Verifizierung
Config.REWARDS = {
	Coins = 1000,           -- In-Game Währung
	GiveBadge = false,      -- Roblox Badge geben? (benötigt Badge ID)
	BadgeId = 0,            -- Roblox Badge Asset ID (falls GiveBadge=true)
	TagPlayers = true,      -- "Verified" Tag zum Spieler hinzufügen?
	TagColor = Color3.fromRGB(88, 101, 242)  -- Farbe des Tags
}

-- ⏱️ Timeouts & Retries
Config.TIMEOUT_SECONDS = 10
Config.MAX_RETRIES = 2

-- 📝 Debug-Modus (auf false setzen in Production!)
Config.DEBUG = false

return Config