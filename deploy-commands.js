import { REST, Routes } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config();

const { clientId, guildId, token } = {
    clientId: process.env.DISCORD_CLIENT_ID,
    guildId: process.env.DISCORD_GUILD_ID,
    token: process.env.DISCORD_TOKEN,
};

const commands = [];

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Grab all the command files directly from the commands folder
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    // Convert the file path to a proper URL format for Windows compatibility
    const fileUrl = `file://${filePath}`;
    
    try {
        const commandModule = await import(fileUrl);
        const command = commandModule.default;
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    } catch (error) {
        console.error(`Error importing command from ${filePath}:`, error);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    
    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
    );
    
    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
} catch (error) {
    console.error(error);
}