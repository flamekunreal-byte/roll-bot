const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

const DATA_FILE = "./data.json";

let userData = {};
if (fs.existsSync(DATA_FILE)) {
  userData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
}

const roles = {
  "Part I": "1504750381539004477",
  "Part II": "1504750412132253807",
  "Part III": "1504750442029256714",

  "Reset I": "1504750482449764422",
  "Reset II": "1504750515613995089",
  "Reset III": "1504750540892934164",

  "Gold Part I": "1504750609285386280",
  "Gold Part II": "1504750658157281451",
  "Gold Part III": "1504750678961033257",

  "Rainbow Part I": "1504750984553824326",
  "Rainbow Part II": "1504751068242771968",
  "Rainbow Part III": "1504751085980745759",

  "Dark Part I": "1504751136815579246",
  "Dark Part II": "1504751199168237709",
  "Dark Part III": "1504751221884452895",

  "Tier I": "1504751280554246247",
  "Tier II": "1504751329808220180",
  "Tier III": "1504751354156027915",

  "Automation I": "1504751406589153372",
  "Automation II": "1504751456388124732",
  "Automation III": "1504751471957114980",

  "Deep Research I": "1504751515599114240",
  "Deep Research II": "1504751560356528269",
  "Deep Research III": "1504751581336440972",

  "Everything I": "1504751610167951470",
  "Everything II": "1504751729076473966",
  "Everything III": "1504751748986962030"
};

function roll() {
  const rand = Math.random();

  if (rand < 1 / 100000000) return ["Everything III", "Everything III (1/100,000,000)"];
  if (rand < 1 / 10000000) return ["Everything II", "Everything II (1/10,000,000)"];
  if (rand < 1 / 5000000) return ["Everything I", "Everything I (1/5,000,000)"];

  if (rand < 1 / 2000000) return ["Deep Research III", "Deep Research III (1/2,000,000)"];
  if (rand < 1 / 1000000) return ["Deep Research II", "Deep Research II (1/1,000,000)"];
  if (rand < 1 / 750000) return ["Deep Research I", "Deep Research I (1/750,000)"];

  if (rand < 1 / 500000) return ["Automation III", "Automation III (1/500,000)"];
  if (rand < 1 / 250000) return ["Automation II", "Automation II (1/250,000)"];
  if (rand < 1 / 150000) return ["Automation I", "Automation I (1/150,000)"];

  if (rand < 1 / 100000) return ["Tier III", "Tier III (1/100,000)"];
  if (rand < 1 / 75000) return ["Tier II", "Tier II (1/75,000)"];
  if (rand < 1 / 50000) return ["Tier I", "Tier I (1/50,000)"];

  if (rand < 1 / 30000) return ["Dark Part III", "Dark Part III (1/30,000)"];
  if (rand < 1 / 15000) return ["Dark Part II", "Dark Part II (1/15,000)"];
  if (rand < 1 / 7000) return ["Dark Part I", "Dark Part I (1/7,000)"];

  if (rand < 1 / 4000) return ["Rainbow Part III", "Rainbow Part III (1/4,000)"];
  if (rand < 1 / 2000) return ["Rainbow Part II", "Rainbow Part II (1/2,000)"];
  if (rand < 1 / 1000) return ["Rainbow Part I", "Rainbow Part I (1/1,000)"];

  if (rand < 1 / 600) return ["Gold Part III", "Gold Part III (1/600)"];
  if (rand < 1 / 300) return ["Gold Part II", "Gold Part II (1/300)"];
  if (rand < 1 / 150) return ["Gold Part I", "Gold Part I (1/150)"];

  if (rand < 1 / 75) return ["Reset III", "Reset III (1/75)"];
  if (rand < 1 / 40) return ["Reset II", "Reset II (1/40)"];
  if (rand < 1 / 20) return ["Reset I", "Reset I (1/20)"];

  if (rand < 1 / 10) return ["Part III", "Part III (1/10)"];
  if (rand < 1 / 6) return ["Part II", "Part II (1/6)"];

  return ["Part I", "Part I (1/3)"];
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.CHANNEL_ID) return;
  if (message.content !== "?roll") return;

  const [rarityKey, displayText] = roll();
  const member = message.member;

  if (!userData[member.id]) {
    userData[member.id] = [];
  }

  const alreadyOwned = userData[member.id].includes(rarityKey);

  const roleId = roles[rarityKey];

  try {
    if (roleId && !member.roles.cache.has(roleId)) {
      await member.roles.add(roleId);
    }
  } catch (err) {
    console.log("Role error:", err);
  }

  let reply = `🎲 You got: **${displayText}**`;

  if (!alreadyOwned) {
    userData[member.id].push(rarityKey);
    saveData();

    reply += `\n🎉 You have been awarded with a new role`;
  }

  await message.reply(reply);
});

client.login(process.env.TOKEN);
