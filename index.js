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

// -------------------- DATA --------------------
const DATA_FILE = "./data.json";

let userData = {};
let pendingRebirth = {};

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      userData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch {
      userData = {};
    }
  }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
}

loadData();

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
      rarest: null
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

// -------------------- ROLL --------------------
function roll(luck) {
  const r = Math.random();

  const check = (chance, name, display) => {
    if (r < chance * luck) {
      return { name, display };
    }
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
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const user = getUser(message.member.id);

  // ---------------- ROLL ----------------
  if (message.content === "?roll") {
    const luck = getLuck(user.level, user.rebirths);
    const result = roll(luck);

    user.rolls++;

    const rarity = result.name;

    user.xp += points[rarity] || 1;

    if (!user.owned[rarity]) user.owned[rarity] = 0;
    user.owned[rarity]++;

    if (!user.rarest || user.owned[rarity] > user.owned[user.rarest]) {
      user.rarest = rarity;
    }

    // level up
    let leveled = false;
    while (user.xp >= xpNeeded(user.level)) {
      user.xp -= xpNeeded(user.level);
      user.level++;
      leveled = true;
    }

    const roleId = roles[rarity];
    if (roleId && !message.member.roles.cache.has(roleId)) {
      await message.member.roles.add(roleId);
    }

    saveData();

    let reply =
`🎲 ${rarity} [${result.display}]
⭐ Level: ${user.level}
🔁 Rolls: ${user.rolls}
🍀 Luck: x${luck.toFixed(2)}`;

    if (leveled) reply += `\n⬆️ Level up!`;

    if (user.owned[rarity] === 1) {
      reply += `\n🎉 New rarity unlocked!`;
    }

    return message.reply(reply);
  }

  // ---------------- REBIRTH ----------------
  if (message.content === "?rebirth") {
    const required = Math.floor(1000 * Math.pow(2.5, user.rebirths));

    if (user.rolls < required) {
      return message.reply(`❌ You need ${required} rolls to rebirth.`);
    }

    pendingRebirth[message.member.id] = true;
    return message.reply(`⚠️ Type **?rebirth confirm** to reset for +1 rebirth (x2 luck)`);
  }

  if (message.content === "?rebirth confirm") {
    if (!pendingRebirth[message.member.id]) return;

    const user = getUser(message.member.id);

    user.rebirths++;
    user.level = 1;
    user.xp = 0;
    user.rolls = 0;

    pendingRebirth[message.member.id] = false;

    saveData();

    return message.reply(`🔥 Rebirth successful! You now have x${Math.pow(2, user.rebirths)} luck multiplier`);
  }

  // ---------------- LEADERBOARD ----------------
  if (message.content === "?leaderboard") {
    const entries = Object.entries(userData);

    const topRolls = [...entries]
      .sort((a, b) => (b[1].rolls || 0) - (a[1].rolls || 0))
      .slice(0, 5)
      .map(([id, d], i) => `${i + 1}. <@${id}> - ${d.rolls || 0} rolls`)
      .join("\n");

    const topLevel = [...entries]
      .sort((a, b) => (b[1].level || 1) - (a[1].level || 1))
      .slice(0, 5)
      .map(([id, d], i) => `${i + 1}. <@${id}> - Level ${d.level || 1}`)
      .join("\n");

    const topRare = [...entries]
      .map(([id, d]) => {
        const rare = d.rarest || "None";
        const count = d.owned?.[rare] || 0;
        return { id, rare, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((x, i) => `${i + 1}. <@${x.id}> - ${x.rare} (${x.count}x)`)
      .join("\n");

    return message.reply(
`📊 **Leaderboard**

🔁 Total Rolls:
${topRolls}

⭐ Highest Level:
${topLevel}

💎 Rarest Rolls:
${topRare}`
    );
  }
});

client.login(process.env.TOKEN);
