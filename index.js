const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");

// ================= CONFIG =================
const CHANNEL_ID = "1504547166088069181";
const DATA_FILE = "./data.json";
const EMBED_COLOR = 0xFFDE10;

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  allowedMentions: { parse: [] }
});

// ================= DATA =================
let userData = {};
let pendingRebirth = {};
let activeBoost = {};

// ================= LOAD / SAVE =================
function loadData() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}");
  userData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "{}");
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
}

loadData();
setInterval(saveData, 30000);

// ================= ROLES (UNCHANGED) =================
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

// ================= POINTS (UNCHANGED) =================
const points = {
  "Part I": 1, "Part II": 2, "Part III": 3,
  "Reset I": 5, "Reset II": 7, "Reset III": 10,
  "Gold Part I": 15, "Gold Part II": 20, "Gold Part III": 25,
  "Rainbow Part I": 50, "Rainbow Part II": 65, "Rainbow Part III": 80,
  "Dark Part I": 100, "Dark Part II": 150, "Dark Part III": 200,
  "Tier I": 300, "Tier II": 400, "Tier III": 500,
  "Automation I": 650, "Automation II": 800, "Automation III": 1000,
  "Deep Research I": 1500, "Deep Research II": 2500, "Deep Research III": 3500,
  "Everything I": 5000, "Everything II": 7500, "Everything III": 10000
};

// ================= USER =================
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

// ================= LUCK =================
function xpNeeded(level) {
  return Math.floor(5 * Math.pow(1.5, level - 1));
}

function getLuck(level, rebirths) {
  return Math.pow(1.2, level - 1) * Math.pow(2, rebirths);
}

// ================= DICE (UNCHANGED) =================
const boosts = {
  "lucky dice": 5,
  "golden lucky dice": 25,
  "diamond lucky dice": 100,
  "cosmic lucky dice": 1000
};

function giveDice(user) {
  const r = Math.random();
  if (r < 1 / 10000) return user.inventory["Cosmic Lucky Dice"]++, "🌌 Cosmic Lucky Dice";
  if (r < 1 / 2500) return user.inventory["Diamond Lucky Dice"]++, "💎 Diamond Lucky Dice";
  if (r < 1 / 500) return user.inventory["Golden Lucky Dice"]++, "🥇 Golden Lucky Dice";
  if (r < 1 / 50) return user.inventory["Lucky Dice"]++, "🎲 Lucky Dice";
  return null;
}

// ================= FIXED ROLL (IMPORTANT FIX) =================
// FIX: no more broken overlap logic — each check is independent
function roll(luck) {
  const check = (chance, name, display) =>
    Math.random() < chance * luck ? { name, display } : null;

  return (
    check(1/100000000,"Everything III","1/100,000,000") ||
    check(1/10000000,"Everything II","1/10,000,000") ||
    check(1/5000000,"Everything I","1/5,000,000") ||

    check(1/2000000,"Deep Research III","1/2,000,000") ||
    check(1/1000000,"Deep Research II","1/1,000,000") ||
    check(1/750000,"Deep Research I","1/750,000") ||

    check(1/500000,"Automation III","1/500,000") ||
    check(1/250000,"Automation II","1/250,000") ||
    check(1/150000,"Automation I","1/150,000") ||

    check(1/100000,"Tier III","1/100,000") ||
    check(1/75000,"Tier II","1/75,000") ||
    check(1/50000,"Tier I","1/50,000") ||

    check(1/30000,"Dark Part III","1/30,000") ||
    check(1/15000,"Dark Part II","1/15,000") ||
    check(1/7000,"Dark Part I","1/7,000") ||

    check(1/4000,"Rainbow Part III","1/4,000") ||
    check(1/2000,"Rainbow Part II","1/2,000") ||
    check(1/1000,"Rainbow Part I","1/1,000") ||

    check(1/600,"Gold Part III","1/600") ||
    check(1/300,"Gold Part II","1/300") ||
    check(1/150,"Gold Part I","1/150") ||

    check(1/75,"Reset III","1/75") ||
    check(1/40,"Reset II","1/40") ||
    check(1/20,"Reset I","1/20") ||

    check(1/10,"Part III","1/10") ||
    check(1/6,"Part II","1/6") ||

    { name:"Part I", display:"1/3" }
  );
}

// ================= EMBED =================
const embed = t => new EmbedBuilder()
  .setColor(EMBED_COLOR)
  .setTitle(t);

// ================= RARITY FIX =================
const rarityRank = Object.keys(points)
  .reduce((a, k, i) => (a[k] = i + 1, a), {});

// ================= PROFILE (NEW - ADDED ONLY) =================
function handleProfile(message) {
  const target = message.mentions.users.first() || message.author;
  const user = getUser(target.id);

  const rare = user.rarest || "None";

  return message.reply({
    embeds: [
      embed("👤 Profile").addFields(
        { name: "User", value: target.username },
        { name: "⭐ Level", value: `${user.level}`, inline: true },
        { name: "🔁 Rolls", value: `${user.rolls}`, inline: true },
        { name: "💎 Rarest Roll", value: `${rare} (${user.owned[rare] || 0}x)` }
      )
    ]
  });
}

// ================= MAIN BOT =================
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;
  if (message.channel.id !== CHANNEL_ID) return;

  const user = getUser(message.author.id);

  // ---------------- ROLL ----------------
  if (message.content === "?roll") {

    const boost = activeBoost[message.author.id] || 1;
    delete activeBoost[message.author.id];

    const luck = getLuck(user.level, user.rebirths) * boost;
    const result = roll(luck);

    user.rolls++;
    user.xp += points[result.name];

    user.owned[result.name] = (user.owned[result.name] || 0) + 1;

    // FIXED rarest tracking
    if (!user.rarest || rarityRank[result.name] > rarityRank[user.rarest]) {
      user.rarest = result.name;
    }

    let leveled = false;
    while (user.xp >= xpNeeded(user.level)) {
      user.xp -= xpNeeded(user.level);
      user.level++;
      leveled = true;
    }

    const dice = giveDice(user);

    saveData();

    let reply =
`🎲 ${result.name} [${result.display}]
⭐ Level: ${user.level}
📊 XP: ${user.xp}/${xpNeeded(user.level)}
🔁 Rolls: ${user.rolls}
🍀 Luck: x${luck.toFixed(2)}`;

    if (dice) reply += `\n🎁 Dice: ${dice}`;
    if (leveled) reply += `\n⬆️ Level Up!`;

    return message.reply(reply);
  }

  // ---------------- REBIRTH ----------------
  if (message.content === "?rebirth") {
    const req = Math.floor(1000 * Math.pow(2.5, user.rebirths));

    if (user.rolls < req)
      return message.reply(`❌ Need ${req} rolls.`);

    pendingRebirth[message.author.id] = true;
    return message.reply("⚠️ Type ?rebirth confirm");
  }

  if (message.content === "?rebirth confirm") {
    if (!pendingRebirth[message.author.id]) return;

    user.rebirths++;
    user.level = 1;
    user.xp = 0;
    user.rolls = 0;

    pendingRebirth[message.author.id] = false;
    saveData();

    return message.reply("🔥 Rebirth complete!");
  }

  // ---------------- PROFILE (NEW) ----------------
  if (message.content.startsWith("?profile")) {
    return handleProfile(message);
  }

  // ---------------- LEADERBOARD ----------------
  if (message.content === "?leaderboard") {

    const getName = id =>
      message.guild.members.cache.get(id)?.displayName || "Unknown";

    const entries = Object.entries(userData);

    const topRolls = [...entries]
      .sort((a,b)=>b[1].rolls-a[1].rolls)
      .slice(0,5)
      .map((x,i)=>`${i+1}. ${getName(x[0])} — ${x[1].rolls}`)
      .join("\n");

    const topLevels = [...entries]
      .sort((a,b)=>b[1].level-a[1].level)
      .slice(0,5)
      .map((x,i)=>`${i+1}. ${getName(x[0])} — ${x[1].level}`)
      .join("\n");

    const topRare = [...entries]
      .map(x => {
        const r = x[1].rarest || "None";
        return {
          id: x[0],
          rare: r,
          count: x[1].owned?.[r] || 0
        };
      })
      .sort((a,b)=>b.count-a.count)
      .slice(0,5)
      .map((x,i)=>`${i+1}. ${getName(x.id)} — ${x.rare} (${x.count}x)`)
      .join("\n");

    return message.reply(
`📊 LEADERBOARD

🔁 Rolls:
${topRolls}

⭐ Levels:
${topLevels}

💎 Rarest:
${topRare}`
    );
  }
});

client.login(process.env.TOKEN);
