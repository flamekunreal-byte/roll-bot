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

// ================= SAVE SYSTEM =================
function loadData() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}");
  userData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "{}");
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
}

loadData();
setInterval(saveData, 30000);

// ================= ROLES =================
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

// ================= POINTS =================
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

// ================= DICE =================
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

// ================= ROLL =================
function roll(luck) {
  const check = (c, n, d) =>
    Math.random() < c * luck ? { name: n, display: d } : null;

  return (
    check(1/100000000,"Everything III","1/100M") ||
    check(1/10000000,"Everything II","1/10M") ||
    check(1/5000000,"Everything I","1/5M") ||

    check(1/2000000,"Deep Research III","1/2M") ||
    check(1/1000000,"Deep Research II","1/1M") ||
    check(1/750000,"Deep Research I","1/750K") ||

    check(1/500000,"Automation III","1/500K") ||
    check(1/250000,"Automation II","1/250K") ||
    check(1/150000,"Automation I","1/150K") ||

    check(1/100000,"Tier III","1/100K") ||
    check(1/75000,"Tier II","1/75K") ||
    check(1/50000,"Tier I","1/50K") ||

    check(1/30000,"Dark Part III","1/30K") ||
    check(1/15000,"Dark Part II","1/15K") ||
    check(1/7000,"Dark Part I","1/7K") ||

    check(1/4000,"Rainbow Part III","1/4K") ||
    check(1/2000,"Rainbow Part II","1/2K") ||
    check(1/1000,"Rainbow Part I","1/1K") ||

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
const embed = (title) =>
  new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle(title);

// ================= COMMANDS =================

// -------- ROLL --------
async function handleRoll(msg, u) {

  const boost = activeBoost[msg.author.id] || 1;
  delete activeBoost[msg.author.id];

  const luck = getLuck(u.level, u.rebirths) * boost;
  const r = roll(luck);

  u.rolls++;
  u.xp += points[r.name];
  u.owned[r.name] = (u.owned[r.name] || 0) + 1;

  if (!u.rarest || Object.keys(points).indexOf(r.name) >
      Object.keys(points).indexOf(u.rarest)) {
    u.rarest = r.name;
  }

  let leveled = false;
  while (u.xp >= xpNeeded(u.level)) {
    u.xp -= xpNeeded(u.level);
    u.level++;
    leveled = true;
  }

  const dice = giveDice(u);

  saveData();

  const e = embed("🎲 Roll Result")
    .addFields(
      { name:"Rarity", value:`**${r.name}** (${r.display})` },
      { name:"⭐ Level", value:`${u.level}`, inline:true },
      { name:"📊 XP", value:`${u.xp}/${xpNeeded(u.level)}`, inline:true },
      { name:"🔁 Rolls", value:`${u.rolls}`, inline:true },
      { name:"🍀 Luck", value:`x${luck.toFixed(2)}`, inline:true }
    );

  if (dice)
    e.addFields({ name:"🎁 Dice Found", value:`**${dice}**` });

  if (leveled)
    e.addFields({ name:"⬆️ Level Up", value:"You leveled up!" });

  return msg.reply({ embeds:[e] });
}

// -------- INVENTORY --------
function handleInv(msg, u) {
  const i = u.inventory;

  return msg.reply({
    embeds: [
      embed("🎒 Inventory")
        .addFields(
          { name:"🎲 Lucky Dice", value:`${i["Lucky Dice"]}x\n?use lucky dice`, inline:true },
          { name:"🥇 Golden Dice", value:`${i["Golden Lucky Dice"]}x\n?use golden lucky dice`, inline:true },
          { name:"💎 Diamond Dice", value:`${i["Diamond Lucky Dice"]}x\n?use diamond lucky dice`, inline:true },
          { name:"🌌 Cosmic Dice", value:`${i["Cosmic Lucky Dice"]}x\n?use cosmic lucky dice`, inline:true }
        )
    ]
  });
}

// -------- PROFILE --------
function handleProfile(msg) {
  const t = msg.mentions.users.first() || msg.author;
  const u = getUser(t.id);

  return msg.reply({
    embeds: [
      embed("👤 Profile")
        .addFields(
          { name:"User", value:`**${t.username}**` },
          { name:"⭐ Level", value:`${u.level}`, inline:true },
          { name:"🔁 Rolls", value:`${u.rolls}`, inline:true },
          { name:"💎 Rarest", value:`${u.rarest || "None"} (${u.owned[u.rarest] || 0}x)` }
        )
    ]
  });
}

// ================= BOT =================
client.on("messageCreate", async msg => {
  if (!msg.guild || msg.author.bot) return;
  if (msg.channel.id !== CHANNEL_ID) return;

  const u = getUser(msg.author.id);

  if (msg.content === "?roll") return handleRoll(msg, u);
  if (msg.content === "?inv") return handleInv(msg, u);
  if (msg.content.startsWith("?profile")) return handleProfile(msg);

});

client.login(process.env.TOKEN);
