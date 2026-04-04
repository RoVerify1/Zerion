--[[
	🎮 RoVerify - Roblox Verification System
	📦 GitHub: https://github.com/RoVerify1/BlockVerify.com
	📄 Raw URL: https://raw.githubusercontent.com/RoVerify1/BlockVerify.com/main/roblox/VerificationSystem.lua	
	🔧 INSTALLATION:
	1. Dieses Script in ServerScriptService einfügen
	2. Config.lua ebenfalls hochladen ODER Config direkt im Script anpassen
	3. In Roblox Studio: Game Settings → Security → "Allow HTTP Requests" ✅ aktivieren
	4. Game veröffentlichen & testen!
	
	⚠️ WICHTIG: Niemals sensible Daten im Client-Script speichern!
]]

-- ===== KONFIGURATION =====
-- Option A: Config.lua laden (empfohlen)
-- local Config = require(script:WaitForChild("Config"))

-- Option B: Config direkt hier (einfacher für GitHub Raw)
local Config = {
	API_BASE = "https://roverify.base44.app",
	GAME_SIGNATURE = "CHANGE_THIS_TO_YOUR_SECRET_KEY_12345",
	REWARDS = {
		Coins = 1000,
		GiveBadge = false,
		BadgeId = 0,
		TagPlayers = true,
		TagColor = Color3.fromRGB(88, 101, 242)
	},
	TIMEOUT_SECONDS = 10,
	MAX_RETRIES = 2,
	DEBUG = true
}

-- ===== SERVICES =====
local HttpService = game:GetService("HttpService")
local ServerStorage = game:GetService("ServerStorage")
local Players = game:GetService("Players")

-- ===== MODULE: Security =====
local Security = {}

-- Einfache Signatur generieren (für API-Validierung)
function Security.GenerateSignature(playerId, code, timestamp)
	local raw = playerId .. ":" .. tostring(code) .. ":" .. tostring(timestamp) .. ":" .. Config.GAME_SIGNATURE
	-- Simple Hash (in Production: HMAC-SHA256 mit Module verwenden)
	local hash = 0
	for i = 1, #raw do
		hash = bit32.bxor(hash, bit32.lrotate(hash, 5) + string.byte(raw, i))
	end
	return string.format("%08x", hash)
end

-- ===== MODULE: API =====
local API = {}

-- HTTP POST mit Retry-Logic
function API.Post(endpoint, data, player)
	local url = Config.API_BASE .. endpoint
	local timestamp = os.time()
	
	-- Headers mit Signatur
	local headers = {
		["Content-Type"] = "application/json",
		["X-Game-Signature"] = Security.GenerateSignature(player.UserId, data.verificationCode or "", timestamp),
		["X-Player-Id"] = tostring(player.UserId),
		["X-Timestamp"] = tostring(timestamp)
	}
	
	local body = HttpService:JSONEncode(data)
	
	for attempt = 1, Config.MAX_RETRIES do
		local success, result = pcall(function()
			return HttpService:PostAsync(url, body, Enum.HttpContentType.ApplicationJson, headers, false)
		end)
		
		if success then
			local decoded = HttpService:JSONDecode(result)
			if Config.DEBUG then
				print(`[RoVerify] API Response: {HttpService:JSONEncode(decoded)}`)
			end
			return decoded
		else
			warn(`[RoVerify] API Request failed (attempt {attempt}/{Config.MAX_RETRIES}): {result}`)
			task.wait(1)
		end
	end
	
	return nil
end

-- Verifizierungsstatus prüfen
function API.CheckStatus(player)
	local response = API.Post("/api/verify/status", {
		robloxUserId = player.UserId
	}, player)
	
	if response and response.success then
		return response.data.isVerified, response.data
	end
	return false, nil
end

-- ===== MODULE: Rewards =====
local Rewards = {}

-- Belohnung geben nach erfolgreicher Verifizierung
function Rewards.GiveRewards(player)
	local rewards = Config.REWARDS
	
	-- 1. Coins geben (angepasst an dein System)
	local leaderstats = player:FindFirstChild("leaderstats")
	if leaderstats and leaderstats:FindFirstChild("Coins") then
		leaderstats.Coins.Value = leaderstats.Coins.Value + rewards.Coins
		print(`[RoVerify] Gave {rewards.Coins} coins to {player.Name}`)
	end
	
	-- 2. Roblox Badge (optional)
	if rewards.GiveBadge and rewards.BadgeId > 0 then
		local BadgeService = game:GetService("BadgeService")
		local success, err = pcall(function()
			BadgeService:AwardBadge(player.UserId, rewards.BadgeId)
		end)
		if not success then
			warn(`[RoVerify] Failed to award badge: {err}`)
		end
	end
	
	-- 3. Verified Tag hinzufügen
	if rewards.TagPlayers then
		-- Entferne alten Tag falls vorhanden
		local oldTag = player:FindFirstChild("VerifiedTag")
		if oldTag then oldTag:Destroy() end
		
		-- Neuer Tag
		local tag = Instance.new("StringValue")
		tag.Name = "VerifiedTag"
		tag.Value = "✅ Verified"
		tag.Parent = player
		
		-- Optional: Farbe speichern für GUI-Scripts
		local color = Instance.new("Color3Value")
		color.Name = "VerifiedColor"
		color.Value = rewards.TagColor
		color.Parent = tag
	end
	
	-- 4. Nachricht an Spieler
	player:Chat("🎉 Glückwunsch! Dein Account wurde verifiziert!")
	
	-- 5. Log
	print(`[RoVerify] {player.Name} ({player.UserId}) received verification rewards`)
end

-- ===== HAUPT-MODULE =====
local VerificationSystem = {}
VerificationSystem.VerifiedCache = {} -- Lokaler Cache für Performance

-- Initialisierung
function VerificationSystem.Init()
	print("🔐 RoVerify System starting...")
	
	-- RemoteEvent für Client-Kommunikation
	local remote = Instance.new("RemoteEvent")
	remote.Name = "RoVerifyEvent"
	remote.Parent = ServerStorage
	
	-- Event Handler
	remote.OnServerEvent:Connect(function(player, action, data)
		if action == "StartVerification" then
			VerificationSystem.HandleStartVerification(player, data)
		elseif action == "SubmitCode" then
			VerificationSystem.HandleSubmitCode(player, data)
		elseif action == "CheckStatus" then
			VerificationSystem.HandleCheckStatus(player)
		end
	end)
	
	-- Player Join Handler
	Players.PlayerAdded:Connect(function(player)
		VerificationSystem.OnPlayerJoin(player)
	end)
	
	-- Bestehende Spieler prüfen
	for _, player in ipairs(Players:GetPlayers()) do
		VerificationSystem.OnPlayerJoin(player)
	end
	
	print("✅ RoVerify System ready!")
end

-- Bei Player Join
function VerificationSystem.OnPlayerJoin(player)
	task.spawn(function()
		-- Kurz warten damit Leaderstats geladen sind
		task.wait(2)
		
		local isVerified, data = API.CheckStatus(player)
		
		if isVerified then
			VerificationSystem.VerifiedCache[player.UserId] = true
			Rewards.GiveRewards(player)
		end
	end)
end

-- Verifizierung starten (Code generieren)
function VerificationSystem.HandleStartVerification(player, data)
	local robloxUsername = data?.robloxUsername
	if not robloxUsername then
		return { success = false, message = "Roblox Username fehlt" }
	end
	
	local response = API.Post("/api/verify/start", {
		robloxUsername = robloxUsername
	}, player)
	
	if response?.success then
		return { 
			success = true, 
			code = response.data.code,
			robloxUserId = response.data.robloxUserId
		}
	else
		return { success = false, message = response?.message or "Fehler beim Starten" }
	end
end

-- Code einreichen & prüfen
function VerificationSystem.HandleSubmitCode(player, data)
	local code = data?.code
	if not code then
		return { success = false, message = "Code fehlt" }
	end
	
	local response = API.Post("/api/verify/game", {
		robloxUserId = player.UserId,
		verificationCode = code:upper():gsub("[^A-Z0-9]", "") -- Sanitize
	}, player)
	
	if response?.success then
		-- Cache updaten & Belohnung geben
		VerificationSystem.VerifiedCache[player.UserId] = true
		task.defer(Rewards.GiveRewards, player)
		
		return { success = true, message = response.message }
	else
		return { success = false, message = response?.message or "Code ungültig" }
	end
end

-- Status abfragen (für GUI)
function VerificationSystem.HandleCheckStatus(player)
	-- Erst Cache prüfen
	if VerificationSystem.VerifiedCache[player.UserId] then
		return { success = true, isVerified = true }
	end
	
	-- Sonst API fragen
	local isVerified, data = API.CheckStatus(player)
	if isVerified then
		VerificationSystem.VerifiedCache[player.UserId] = true
	end
	
	return { success = true, isVerified = isVerified, data = data }
end

-- Public: Extern prüfen ob Spieler verifiziert ist
function VerificationSystem.IsVerified(player)
	if not player or not player.UserId then return false end
	
	-- Cache Check
	if VerificationSystem.VerifiedCache[player.UserId] then
		return true
	end
	
	-- API Check (sync - vorsichtig verwenden!)
	local isVerified = API.CheckStatus(player)
	if isVerified then
		VerificationSystem.VerifiedCache[player.UserId] = true
	end
	
	return isVerified == true
end

-- ===== START =====
-- Warte kurz damit alle Services bereit sind
task.defer(function()
	task.wait(3)
	VerificationSystem.Init()
end)

-- Export für andere Scripts
return VerificationSystem