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

// ---------------- SAFE JSON LOAD ----------------
let userData = {};

try {
  if (fs.existsSync(DATA_FILE)) {
    userData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }
} catch (e) {
  console.log("Corrupt data.json detected, resetting safely");
  userData = {};
}

// ---------------- ATOMIC SAVE (prevents corruption) ----------------
function saveData() {
  const tempFile = DATA_FILE + ".tmp";
  fs.writeFileSync(tempFile, JSON.stringify(userData, null, 2));
  fs.renameSync(tempFile, DATA_FILE);
}

// ---------------- POINTS ----------------
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

// ---------------- ROLES ----------------
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

// ---------------- USER DATA ----------------
function getUser(id) {
  if (!userData[id]) {
    userData[id] = {
      xp: 0,
      level: 1,
      owned: [],
      rolls: 0,
      rarityCounts: {}
    };
  }
  return userData[id];
}

function xpNeeded(level) {
  return Math.floor(5 * Math.pow(1.5, level - 1));
}

function getLuck(level) {
  return Math.pow(1.2, level - 1);
}

// ---------------- ROLL ----------------
function roll(luck) {
  const r = Math.random();

  const check = (chance, name, displayChance) => {
    if (r < chance * luck) {
      return { name, chance: displayChance };
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

    { name: "Part I", chance: "1/3" }
  );
}

// ---------------- BOT ----------------
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.CHANNEL_ID) return;

  const user = getUser(message.member.id);

  // ---------------- ROLL ----------------
  if (message.content === "?roll") {
    const luck = getLuck(user.level);
    const result = roll(luck);

    const rarity = result.name;

    user.rolls++;
    user.rarityCounts[rarity] = (user.rarityCounts[rarity] || 0) + 1;

    const gainedXP = points[rarity] || 1;
    user.xp += gainedXP;

    let leveledUp = false;
    while (user.xp >= xpNeeded(user.level)) {
      user.xp -= xpNeeded(user.level);
      user.level++;
      leveledUp = true;
    }

    const roleId = roles[rarity];
    if (roleId && !message.member.roles.cache.has(roleId)) {
      await message.member.roles.add(roleId);
    }

    if (!user.owned.includes(rarity)) {
      user.owned.push(rarity);
    }

    saveData();

    let reply =
`🎲 You got: **${rarity} [${result.chance}]**
⭐ Level: ${user.level}
📊 XP +${gainedXP} (${user.xp}/${xpNeeded(user.level)})
🍀 Luck: x${getLuck(user.level).toFixed(2)}`;

    if (leveledUp) reply += `\n⬆️ Level up!`;

    if (!user.owned.includes(rarity)) {
      reply += `\n🎉 You've been awarded with a new role`;
    }

    return message.reply(reply);
  }

  // ---------------- LEADERBOARD ----------------
  if (message.content === "?leaderboard") {
    const sorted = Object.entries(userData)
      .sort((a, b) => b[1].level - a[1].level);

    let text = `🏆 **Leaderboard**\n\n`;

    for (const [id, data] of sorted.slice(0, 10)) {
      const topRarity = Object.entries(data.rarityCounts || {})
        .sort((a, b) => b[1] - a[1])[0];

      const userTag =
        message.guild.members.cache.get(id)?.user.username || "Unknown";

      text +=
`${userTag}
⭐ Level: ${data.level || 1}
🎲 Rolls: ${data.rolls || 0}
💎 Rarest: ${topRarity ? `${topRarity[0]} (${topRarity[1]}x)` : "None"}

`;
    }

    return message.reply(text);
  }
});

client.login(process.env.TOKEN);
