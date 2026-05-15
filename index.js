const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

function roll() {
  const rand = Math.random() * 100;

  if (rand < 50) return "Stop using the bot please (1/2)";
  if (rand < 75) return "Uncommon (1/4)";
  if (rand < 90) return "Rare (1/10)";
  if (rand < 97) return "Epic (1/33)";
  if (rand < 99.5) return "Legendary (1/200)";
  return "Mythic (1/1000)";
}

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  // only allow this channel
  if (message.channel.id !== process.env.CHANNEL_ID) return;

  if (message.content === "?roll") {
    message.reply(`🎲 You got: **${roll()}**`);
  }
});

client.login(process.env.TOKEN);
