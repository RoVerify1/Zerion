import discord
import json
import asyncio
import os
from dotenv import load_dotenv

# Lade Token aus .env Datei (Sicherheit!)
load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')

# Intents setzen
intents = discord.Intents.default()
intents.guilds = True
intents.messages = True
intents.message_content = True

client = discord.Client(intents=intents)

async def create_structure(guild, data):
    print("Starte Erstellung der Struktur...")
    
    # 1. Rollen erstellen
    role_map = {}
    for role_data in data.get('roles', []):
        name = role_data['name']
        color = discord.Colour.from_str(role_data.get('color', '#95a5a6'))
        
        # Prüfen ob Rolle schon existiert
        existing_role = discord.utils.get(guild.roles, name=name)
        if existing_role:
            print(f"Rolle '{name}' existiert bereits.")
            role_map[name] = existing_role
        else:
            try:
                new_role = await guild.create_role(name=name, color=color, reason="Auto-Setup")
                print(f"Rolle '{name}' erstellt.")
                role_map[name] = new_role
                await asyncio.sleep(1) # Pause gegen Rate Limits
            except Exception as e:
                print(f"Fehler beim Erstellen der Rolle {name}: {e}")

    everyone_role = guild.default_role
    unverified_role = role_map.get('Unverified')
    verified_role = role_map.get('Verified')
    mod_role = role_map.get('Mod')
    admin_role = role_map.get('Admin')

    # Helper für Permissions
    def get_overwrites(category_name):
        overwrites = {
            everyone_role: discord.PermissionOverwrite(read_messages=True, send_messages=False)
        }
        
        if category_name == "🟨 COMMUNITY":
            overwrites[everyone_role] = discord.PermissionOverwrite(read_messages=False)
            if unverified_role:
                overwrites[unverified_role] = discord.PermissionOverwrite(read_messages=False)
            if verified_role:
                overwrites[verified_role] = discord.PermissionOverwrite(read_messages=True, send_messages=True)
            if mod_role:
                overwrites[mod_role] = discord.PermissionOverwrite(read_messages=True, send_messages=True)
            if admin_role:
                overwrites[admin_role] = discord.PermissionOverwrite(read_messages=True, send_messages=True, manage_channels=True)

        elif category_name == "🟥 ADMIN":
            overwrites[everyone_role] = discord.PermissionOverwrite(read_messages=False)
            if unverified_role:
                overwrites[unverified_role] = discord.PermissionOverwrite(read_messages=False)
            if verified_role:
                overwrites[verified_role] = discord.PermissionOverwrite(read_messages=False)
            if mod_role:
                overwrites[mod_role] = discord.PermissionOverwrite(read_messages=True, send_messages=True)
            if admin_role:
                overwrites[admin_role] = discord.PermissionOverwrite(read_messages=True, send_messages=True, manage_channels=True)

        elif category_name == "🟪 WEBSITE / PRODUCT":
             overwrites[everyone_role] = discord.PermissionOverwrite(read_messages=False)
             if unverified_role:
                overwrites[unverified_role] = discord.PermissionOverwrite(read_messages=False)
             if verified_role:
                overwrites[verified_role] = discord.PermissionOverwrite(read_messages=True, send_messages=False) # Nur lesen
             if admin_role:
                overwrites[admin_role] = discord.PermissionOverwrite(read_messages=True, send_messages=True, manage_channels=True)
        
        else: # INFO, VERIFY etc.
             if admin_role:
                overwrites[admin_role] = discord.PermissionOverwrite(read_messages=True, send_messages=True, manage_channels=True)
             if category_name == "🟩 VERIFY" and unverified_role:
                 overwrites[unverified_role] = discord.PermissionOverwrite(read_messages=True, send_messages=True)

        return overwrites

    # 2. Kategorien und Channels erstellen
    for cat_data in data.get('categories', []):
        cat_name = cat_data['name']
        
        # Kategorie erstellen
        overwrites_cat = {everyone_role: discord.PermissionOverwrite(read_messages=True)}
        category = await guild.create_category(name=cat_name, overwrites=overwrites_cat, reason="Auto-Setup")
        print(f"Kategorie '{cat_name}' erstellt.")
        await asyncio.sleep(1)

        # Channels in der Kategorie erstellen
        for channel_data in cat_data.get('channels', []):
            ch_name = channel_data['name']
            ch_type = discord.ChannelType.text if channel_data.get('type') == 'text' else discord.ChannelType.voice
            topic = channel_data.get('topic', None)
            
            overwrites_ch = get_overwrites(cat_name)

            try:
                await guild.create_text_channel(
                    name=ch_name,
                    category=category,
                    topic=topic,
                    overwrites=overwrites_ch,
                    reason="Auto-Setup"
                )
                print(f"  Channel '{ch_name}' erstellt.")
                await asyncio.sleep(1) # Wichtig gegen Rate Limits
            except Exception as e:
                print(f"  Fehler beim Erstellen von {ch_name}: {e}")

@client.event
async def on_ready():
    print(f'Eingeloggt als {client.user}')
    
    # Lade die JSON Datei
    if not os.path.exists('channels.json'):
        print("Fehler: channels.json nicht gefunden!")
        await client.close()
        return

    with open('channels.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    guild_id = int(data['guild_id'])
    guild = client.get_guild(guild_id)

    if guild is None:
        print(f"Server mit ID {guild_id} nicht gefunden. Ist der Bot eingeladen?")
        await client.close()
        return

    await create_structure(guild, data)
    print("✅ Fertig! Alle Channels und Rollen wurden erstellt.")
    await client.close() # Bot nach Abschluss beenden

# Starten
client.run(TOKEN)
