const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

function roll() {
  const rand = Math.random();

  if (rand < 1/100000000) return " Everything III (1/100,000,000)";
  if (rand < 1/10000000) return " Everything II (1/10,000,000)";
  if (rand < 1/5000000) return " Everything I (1/5,000,000)";

  if (rand < 1/2000000) return " Deep Research III (1/2,000,000)";
  if (rand < 1/1000000) return " Deep Research II (1/1,000,000)";
  if (rand < 1/750000) return " Deep Research I (1/750,000)";

  if (rand < 1/500000) return " Automation III (1/500,000)";
  if (rand < 1/250000) return " Automation II (1/250,000)";
  if (rand < 1/150000) return " Automation I (1/150,000)";

  if (rand < 1/100000) return " Tier III (1/100,000)";
  if (rand < 1/75000) return " Tier II (1/75,000)";
  if (rand < 1/50000) return " Tier I (1/50,000)";

  if (rand < 1/30000) return " Void III (1/30,000)";
  if (rand < 1/15000) return " Void II (1/15,000)";
  if (rand < 1/7000) return " Void I (1/7,000)";

  if (rand < 1/4000) return " Rainbow Part III (1/4,000)";
  if (rand < 1/2000) return " Rainbow Part II (1/2,000)";
  if (rand < 1/1000) return " Rainbow Part I (1/1,000)";

  if (rand < 1/600) return " Gold Part III (1/600)";
  if (rand < 1/300) return " Gold Part II (1/300)";
  if (rand < 1/150) return " Gold Part I (1/150)";

  if (rand < 1/75) return " Reset III (1/75)";
  if (rand < 1/40) return " Reset II (1/40)";
  if (rand < 1/20) return " Reset I (1/20)";

  if (rand < 1/10) return " Part III (1/10)";
  if (rand < 1/6) return " Part II (1/6)";

  return " Part I (1/3)";
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
