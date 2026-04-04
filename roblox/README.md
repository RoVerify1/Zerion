\# 🎮 RoVerify - Roblox Integration



\## 📦 Installation



\### Option 1: Manual Copy

1\. Kopiere den Inhalt von `VerificationSystem.lua`

2\. In Roblox Studio: ServerScriptService → + → Script → Code einfügen

3\. Name: `RoVerifySystem`

4\. Game Settings → Security → ✅ "Allow HTTP Requests" aktivieren

5\. Config im Script anpassen (API\_BASE, GAME\_SIGNATURE)



\### Option 2: GitHub Raw Loader (empfohlen)

```lua

\-- In ServerScriptService einfügen:

local HttpService = game:GetService("HttpService")



local function LoadFromGitHub(url, name)

&#x09;local success, result = pcall(function()

&#x09;	return HttpService:GetAsync(url)

&#x09;end)

&#x09;if not success then

&#x09;	warn("Failed to load " .. name .. ": " .. result)

&#x09;	return nil

&#x09;end

&#x09;

&#x09;local script = Instance.new("Script")

&#x09;script.Name = name

&#x09;script.Source = result

&#x09;script.Parent = script.Parent or game:GetService("ServerScriptService")

&#x09;print("✅ Loaded " .. name .. " from GitHub")

&#x09;return script

end



\-- Laden:

LoadFromGitHub(

&#x09;"https://raw.githubusercontent.com/YOUR\_USERNAME/roverify/main/roblox/VerificationSystem.lua",

&#x09;"RoVerifySystem"

)

