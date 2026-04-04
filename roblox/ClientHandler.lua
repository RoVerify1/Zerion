--[[
	🎮 RoVerify - Client Handler
	Platzieren in: StarterPlayer → StarterPlayerScripts
	
	Verwaltet die UI-Kommunikation mit dem Server-Script
]]

local Players = game:GetService("Players")
local ServerStorage = game:GetService("ServerStorage")
local player = Players.LocalPlayer

-- Warte auf RemoteEvent
local remote = ServerStorage:WaitForChild("RoVerifyEvent", 30)
if not remote then
	warn("❌ RoVerifyEvent nicht gefunden!")
	return
end

-- ===== CLIENT MODULE =====
local RoVerifyClient = {}

-- Verifizierung starten
function RoVerifyClient.StartVerification(robloxUsername)
	local response = remote:InvokeServer("StartVerification", {
		robloxUsername = robloxUsername
	})
	return response
end

-- Code einreichen
function RoVerifyClient.SubmitCode(code)
	local response = remote:InvokeServer("SubmitCode", {
		code = code
	})
	return response
end

-- Status prüfen
function RoVerifyClient.CheckStatus()
	local response = remote:InvokeServer("CheckStatus")
	return response
end

-- Event: Server sendet Update
local OnVerificationUpdate = Instance.new("BindableEvent")
RoVerifyClient.Updated = OnVerificationUpdate.Event

remote.OnClientEvent:Connect(function(action, data)
	if action == "VerificationUpdated" then
		OnVerificationUpdate:Fire(data)
	end
end)

-- ===== GUI INTEGRATION (Beispiel) =====
-- Erstelle einfaches GUI für Testing
local function CreateTestGUI()
	local screenGui = Instance.new("ScreenGui")
	screenGui.Name = "RoVerifyGUI"
	screenGui.Parent = player:WaitForChild("PlayerGui")
	screenGui.DisplayOrder = 100
	
	local frame = Instance.new("Frame")
	frame.Size = UDim2.new(0, 350, 0, 200)
	frame.Position = UDim2.new(0.5, -175, 0.5, -100)
	frame.BackgroundColor3 = Color3.fromRGB(35, 35, 45)
	frame.BorderSizePixel = 0
	frame.Visible = false
	frame.Parent = screenGui
	
	-- Title
	local title = Instance.new("TextLabel")
	title.Text = "🔐 RoVerify"
	title.Size = UDim2.new(1, 0, 0, 40)
	title.BackgroundTransparency = 1
	title.TextColor3 = Color3.fromRGB(255, 255, 255)
	title.Font = Enum.Font.SourceSansBold
	title.TextSize = 20
	title.Parent = frame
	
	-- Code Input
	local codeBox = Instance.new("TextBox")
	codeBox.PlaceholderText = "Code eingeben (z.B. ABC-123)"
	codeBox.Size = UDim2.new(1, -40, 0, 35)
	codeBox.Position = UDim2.new(0, 20, 0, 60)
	codeBox.BackgroundColor3 = Color3.fromRGB(50, 50, 65)
	codeBox.TextColor3 = Color3.fromRGB(255, 255, 255)
	codeBox.Font = Enum.Font.SourceSans
	codeBox.TextSize = 16
	codeBox.ClearTextOnFocus = false
	codeBox.Parent = frame
	
	-- Submit Button
	local submitBtn = Instance.new("TextButton")
	submitBtn.Text = "✅ Überprüfen"
	submitBtn.Size = UDim2.new(1, -40, 0, 35)
	submitBtn.Position = UDim2.new(0, 20, 0, 105)
	submitBtn.BackgroundColor3 = Color3.fromRGB(88, 101, 242)
	submitBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
	submitBtn.Font = Enum.Font.SourceSansBold
	submitBtn.TextSize = 16
	submitBtn.Parent = frame
	
	-- Status Label
	local statusLbl = Instance.new("TextLabel")
	statusLbl.Size = UDim2.new(1, 0, 0, 25)
	statusLbl.Position = UDim2.new(0, 0, 0, 150)
	statusLbl.BackgroundTransparency = 1
	statusLbl.TextColor3 = Color3.fromRGB(200, 200, 200)
	statusLbl.Font = Enum.Font.SourceSans
	statusLbl.TextSize = 14
	statusLbl.Parent = frame
	
	-- Toggle GUI mit Command
	game:GetService("ProximityPromptService").PromptButtonHoldBegan:Connect()
	
	submitBtn.MouseButton1Click:Connect(function()
		local code = codeBox.Text:upper():gsub("[^A-Z0-9-]", "")
		statusLbl.Text = "⏳ Prüfe..."
		
		local result = RoVerifyClient.SubmitCode(code)
		if result?.success then
			statusLbl.Text = "✅ " .. (result.message or "Erfolgreich!")
			statusLbl.TextColor3 = Color3.fromRGB(87, 242, 135)
			task.wait(2)
			frame.Visible = false
		else
			statusLbl.Text = "❌ " .. (result?.message or "Fehler")
			statusLbl.TextColor3 = Color3.fromRGB(237, 66, 69)
		end
	end)
	
	-- Expose GUI controls
	RoVerifyClient.ShowGUI = function() frame.Visible = true end
	RoVerifyClient.HideGUI = function() frame.Visible = false end
	RoVerifyClient.SetStatus = function(text, color) 
		statusLbl.Text = text
		if color then statusLbl.TextColor3 = color end
	end
	
	return screenGui
end

-- ===== START =====
print("🎮 RoVerify Client loaded")

-- Test-Command für Admins (entfernen in Production!)
game:GetService("ReplicatedStorage").DefaultChatSystemChatEvents.SayMessageRequest:OnServerEvent:Connect(function(pl, msg)
	if pl == player and msg:lower():find("!roverify") then
		if RoVerifyClient.GUI then
			RoVerifyClient.HideGUI()
			RoVerifyClient.GUI = nil
		else
			RoVerifyClient.GUI = CreateTestGUI()
			RoVerifyClient.ShowGUI()
		end
	end
end)

return RoVerifyClient