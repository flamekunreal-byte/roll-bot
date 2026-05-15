const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  allowedMentions: { parse: [] }
});

// 🔒 YOUR EXISTING VARIABLE (IMPORTANT)
const channelId = "1504547166088069181";

// -------------------- DATA --------------------
const DATA_FILE = "./data.json";

let userData = {};
let pendingRebirth = {};
let activeBoost = {};

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}");
    userData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "{}");
  } catch (err) {
    console.error(err);
    userData = {};
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
  } catch (err) {
    console.error(err);
  }
}

loadData();

// auto-save protection
process.on("exit", saveData);
process.on("SIGINT", () => { saveData(); process.exit(); });
process.on("uncaughtException", (err) => {
  console.error(err);
  saveData();
});

// -------------------- ROLES --------------------
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

// -------------------- POINTS --------------------
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

// -------------------- USER --------------------
function getUser(id) {
  if (!userData[id]) {
    userData[id] = {
      xp: 0,
      level: 1,
      rolls: 0,
      rebirths: 0,
      owned: {},
      rarest: null,

      inventory: {
        "Lucky Dice": 0,
        "Golden Lucky Dice": 0,
        "Diamond Lucky Dice": 0,
        "Cosmic Lucky Dice": 0
      }
    };
  }
  return userData[id];
}

function xpNeeded(level) {
  return Math.floor(5 * Math.pow(1.5, level - 1));
}

function getLuck(level, rebirths) {
  return Math.pow(1.2, level - 1) * Math.pow(2, rebirths);
}

// -------------------- DICE DROP (NOT BOOSTED) --------------------
function giveDice(user) {
  const r = Math.random();

  if (r < 1 / 10000) {
    user.inventory["Cosmic Lucky Dice"]++;
    return "🌌 Cosmic Lucky Dice";
  }
  if (r < 1 / 2500) {
    user.inventory["Diamond Lucky Dice"]++;
    return "💎 Diamond Lucky Dice";
  }
  if (r < 1 / 500) {
    user.inventory["Golden Lucky Dice"]++;
    return "🥇 Golden Lucky Dice";
  }
  if (r < 1 / 50) {
    user.inventory["Lucky Dice"]++;
    return "🎲 Lucky Dice";
  }

  return null;
}

// -------------------- ROLL --------------------
function roll(luck) {
  const r = Math.random();

  const check = (chance, name, display) => {
    if (r < chance * luck) return { name, display };
    return null;
  };

  return (
    check(1 / 100000000, "Everything III", "1/100,000,000") ||
    check(1 / 10000000, "Everything II", "1/10,000,000") ||
    check(1 / 5000000, "Everything I", "1/5,000,000") ||

    check(1 / 2000000, "Deep Research III", "1/2,000,000") ||
    check(1 / 1000000, "Deep Research II", "1/1,000,000") ||
    check(1 / 750000, "Deep Research I", "1/750,000") ||

    check(1 / 500000, "Automation III", "1/500,000") ||
    check(1 / 250000, "Automation II", "1/250,000") ||
    check(1 / 150000, "Automation I", "1/150,000") ||

    check(1 / 100000, "Tier III", "1/100,000") ||
    check(1 / 75000, "Tier II", "1/75,000") ||
    check(1 / 50000, "Tier I", "1/50,000") ||

    check(1 / 30000, "Dark Part III", "1/30,000") ||
    check(1 / 15000, "Dark Part II", "1/15,000") ||
    check(1 / 7000, "Dark Part I", "1/7,000") ||

    check(1 / 4000, "Rainbow Part III", "1/4,000") ||
    check(1 / 2000, "Rainbow Part II", "1/2,000") ||
    check(1 / 1000, "Rainbow Part I", "1/1,000") ||

    check(1 / 600, "Gold Part III", "1/600") ||
    check(1 / 300, "Gold Part II", "1/300") ||
    check(1 / 150, "Gold Part I", "1/150") ||

    check(1 / 75, "Reset III", "1/75") ||
    check(1 / 40, "Reset II", "1/40") ||
    check(1 / 20, "Reset I", "1/20") ||

    check(1 / 10, "Part III", "1/10") ||
    check(1 / 6, "Part II", "1/6") ||

    { name: "Part I", display: "1/3" }
  );
}

// -------------------- BOT --------------------
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  // 🔒 CHANNEL LOCK (USING YOUR VARIABLE)
  if (message.channel.id !== channelId) return;

  const user = getUser(message.member.id);

  // ---------------- ROLL ----------------
if (message.content === "?roll") {

  let boost = activeBoost[message.member.id] || 1;
  delete activeBoost[message.member.id];

  const luck = getLuck(user.level, user.rebirths) * boost;

  const result = roll(luck);
  user.rolls++;

  const rarity = result.name;
  const xpGain = points[rarity] || 1;

  user.xp += xpGain;

  if (!user.owned[rarity]) user.owned[rarity] = 0;
  user.owned[rarity]++;

  if (!user.rarest || user.owned[rarity] > user.owned[user.rarest]) {
    user.rarest = rarity;
  }

  let leveled = false;
  while (user.xp >= xpNeeded(user.level)) {
    user.xp -= xpNeeded(user.level);
    user.level++;
    leveled = true;
  }

  const nextXP = xpNeeded(user.level);

  const dice = giveDice(user);

  saveData();

  let reply =
`🎲 ${rarity} [${result.display}]
⭐ Level ${user.level} | XP ${user.xp}/${nextXP} (+${xpGain})
🔁 Rolls: ${user.rolls}
🍀 Luck: x${luck.toFixed(2)}`;

  if (dice) reply += `\n✨ Found: ${dice}`;
  if (leveled) reply += `\n⬆️ Level up!`;

  return message.reply(reply);
}
  // ---------------- INVENTORY ----------------
  if (message.content === "?inv") {
    const inv = user.inventory;

    return message.reply(
`🎒 INVENTORY

🎲 Lucky Dice: ${inv["Lucky Dice"]}
🥇 Golden Lucky Dice: ${inv["Golden Lucky Dice"]}
💎 Diamond Lucky Dice: ${inv["Diamond Lucky Dice"]}
🌌 Cosmic Lucky Dice: ${inv["Cosmic Lucky Dice"]}`
    );
  }

  // ---------------- USE ----------------
  if (message.content.startsWith("?use")) {

    const input = message.content.slice(4).trim().toLowerCase();

    const boosts = {
      "lucky dice": 5,
      "golden lucky dice": 25,
      "diamond lucky dice": 100,
      "cosmic lucky dice": 1000
    };

    const key = Object.keys(boosts).find(k => k === input);

    if (!key) return message.reply("❌ Invalid item.");
    if (user.inventory[key] <= 0) return message.reply("❌ You don't have this item.");

    user.inventory[key]--;
    activeBoost[message.member.id] = boosts[key];

    saveData();

    return message.reply(`⚡ Used **${key}** → Next roll x${boosts[key]} luck!`);
  }

  // ---------------- REBIRTH ----------------
  if (message.content === "?rebirth") {
    const required = Math.floor(1000 * Math.pow(2.5, user.rebirths));

    if (user.rolls < required) {
      return message.reply(`❌ You need ${required} rolls.`);
    }

    pendingRebirth[message.member.id] = true;
    return message.reply("⚠️ Type ?rebirth confirm");
  }

  if (message.content === "?rebirth confirm") {
    if (!pendingRebirth[message.member.id]) return;

    user.rebirths++;
    user.level = 1;
    user.xp = 0;
    user.rolls = 0;

    pendingRebirth[message.member.id] = false;
    saveData();

    return message.reply("🔥 Rebirth complete!");
  }

  // ---------------- LEADERBOARD ----------------
  if (message.content === "?leaderboard") {
    const entries = Object.entries(userData);

    const getName = (id) => {
      const m = message.guild.members.cache.get(id);
      return m?.displayName || m?.user?.username || "Unknown";
    };

    const topRolls = [...entries]
      .sort((a, b) => (b[1].rolls || 0) - (a[1].rolls || 0))
      .slice(0, 5)
      .map((x, i) => `${i + 1}. ${getName(x[0])} - ${x[1].rolls}`)
      .join("\n");

    return message.reply(`📊 LEADERBOARD\n\n${topRolls}`);
  }
});

client.login(process.env.TOKEN);
