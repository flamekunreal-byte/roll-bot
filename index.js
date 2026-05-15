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

/* ===================== ROLES ===================== */
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

/* ===================== POINTS ===================== */
const points = {
  "Part I": 1,
  "Part II": 2,
  "Part III": 3,

  "Reset I": 5,
  "Reset II": 7,
  "Reset III": 10,

  "Gold Part I": 15,
  "Gold Part II": 20,
  "Gold Part III": 25,

  "Rainbow Part I": 50,
  "Rainbow Part II": 65,
  "Rainbow Part III": 80,

  "Dark Part I": 100,
  "Dark Part II": 150,
  "Dark Part III": 200,

  "Tier I": 300,
  "Tier II": 400,
  "Tier III": 500,

  "Automation I": 650,
  "Automation II": 800,
  "Automation III": 1000,

  "Deep Research I": 1500,
  "Deep Research II": 2500,
  "Deep Research III": 3500,

  "Everything I": 5000,
  "Everything II": 7500,
  "Everything III": 10000
};

/* ===================== ROLL ===================== */
function roll() {
  const r = Math.random();

  if (r < 1 / 100000000) return ["Everything III", "1/100,000,000"];
  if (r < 1 / 10000000) return ["Everything II", "1/10,000,000"];
  if (r < 1 / 5000000) return ["Everything I", "1/5,000,000"];

  if (r < 1 / 2000000) return ["Deep Research III", "1/2,000,000"];
  if (r < 1 / 1000000) return ["Deep Research II", "1/1,000,000"];
  if (r < 1 / 750000) return ["Deep Research I", "1/750,000"];

  if (r < 1 / 500000) return ["Automation III", "1/500,000"];
  if (r < 1 / 250000) return ["Automation II", "1/250,000"];
  if (r < 1 / 150000) return ["Automation I", "1/150,000"];

  if (r < 1 / 100000) return ["Tier III", "1/100,000"];
  if (r < 1 / 75000) return ["Tier II", "1/75,000"];
  if (r < 1 / 50000) return ["Tier I", "1/50,000"];

  if (r < 1 / 30000) return ["Dark Part III", "1/30,000"];
  if (r < 1 / 15000) return ["Dark Part II", "1/15,000"];
  if (r < 1 / 7000) return ["Dark Part I", "1/7,000"];

  if (r < 1 / 4000) return ["Rainbow Part III", "1/4,000"];
  if (r < 1 / 2000) return ["Rainbow Part II", "1/2,000"];
  if (r < 1 / 1000) return ["Rainbow Part I", "1/1,000"];

  if (r < 1 / 600) return ["Gold Part III", "1/600"];
  if (r < 1 / 300) return ["Gold Part II", "1/300"];
  if (r < 1 / 150) return ["Gold Part I", "1/150"];

  if (r < 1 / 75) return ["Reset III", "1/75"];
  if (r < 1 / 40) return ["Reset II", "1/40"];
  if (r < 1 / 20) return ["Reset I", "1/20"];

  if (r < 1 / 10) return ["Part III", "1/10"];
  if (r < 1 / 6) return ["Part II", "1/6"];

  return ["Part I", "1/3"];
}

/* ===================== USER ===================== */
function getUser(id) {
  if (!userData[id]) {
    userData[id] = {
      points: 0,
      level: 0,
      owned: []
    };
  }
  return userData[id];
}

/* ===================== LEVEL SYSTEM ===================== */
function levelCost(level) {
  return Math.floor(5 * Math.pow(1.5, level));
}

function luck(level) {
  return Math.pow(1.2, level);
}

/* ===================== BOT ===================== */
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.CHANNEL_ID) return;

  const user = getUser(message.author.id);

  /* ===== CHECK LEVEL ===== */
  if (message.content === "?level") {
    return message.reply(
      `📊 Level: **${user.level}**\n` +
      `💰 Points: **${user.points}**\n` +
      `⬆️ Next Level Cost: **${levelCost(user.level)}**\n` +
      `✨ Luck: x${luck(user.level).toFixed(2)}`
    );
  }

  /* ===== LEVEL UP ===== */
  if (message.content === "?levelup") {
    const cost = levelCost(user.level);

    if (user.points < cost) {
      return message.reply(`❌ You need **${cost} points** to level up.`);
    }

    user.points -= cost;
    user.level++;

    saveData();

    return message.reply(
      `⬆️ Level Up! You are now level **${user.level}**\n✨ Luck: x${luck(user.level).toFixed(2)}`
    );
  }

  /* ===== ROLL ===== */
  if (message.content !== "?roll") return;

  const [rarity, chance] = roll();

  const roleId = roles[rarity];
  const basePoints = points[rarity] || 0;

  const earned = Math.floor(basePoints * luck(user.level));

  user.points += earned;

  if (!user.owned.includes(rarity)) {
    user.owned.push(rarity);
  }

  try {
    if (roleId && !message.member.roles.cache.has(roleId)) {
      await message.member.roles.add(roleId);
    }
  } catch (e) {
    console.log("Role error:", e);
  }

  saveData();

  message.reply(
    `🎲 You got **${rarity}** (1/${chance})\n` +
    `⭐ +${earned} points\n` +
    `📊 Level: ${user.level} | Luck x${luck(user.level).toFixed(2)}`
  );
});

client.login(process.env.TOKEN);
