const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");

const CHANNEL_ID = "1504547166088069181";
const DATA_FILE = "./data.json";
const COLOR = 0xFFDE10;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  allowedMentions: { parse: [] }
});

// ---------------- DATA ----------------
let userData = {};
let activeBoost = {};
let pendingRebirth = {};

// ---------------- LOAD / SAVE ----------------
function loadData() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}");
  userData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "{}");
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
}

loadData();
process.on("exit", saveData);
process.on("SIGINT", () => { saveData(); process.exit(); });

// ---------------- USER ----------------
function getUser(id) {
  if (!userData[id]) {
    userData[id] = {
      xp: 0,
      level: 1,
      rolls: 0,
      rebirths: 0,
      owned: {},
      rarest: null,

      autorollEnabled: false,
      autorollRunning: false,

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

// ---------------- STATS ----------------
function xpNeeded(level) {
  return Math.floor(5 * Math.pow(1.5, level - 1));
}

function getLuck(level, rebirths) {
  return Math.pow(1.2, level - 1) * Math.pow(2, rebirths);
}

function getXpMultiplier(rebirths) {
  return Math.pow(1.5, rebirths);
}

// ---------------- POINTS ----------------
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

// ---------------- DICE ----------------
function giveDice(user) {
  const r = Math.random();

  if (r < 1 / 10000) return user.inventory["Cosmic Lucky Dice"]++, "🌌 Cosmic Dice";
  if (r < 1 / 2500) return user.inventory["Diamond Lucky Dice"]++, "💎 Diamond Dice";
  if (r < 1 / 500) return user.inventory["Golden Lucky Dice"]++, "🥇 Golden Dice";
  if (r < 1 / 50) return user.inventory["Lucky Dice"]++, "🎲 Lucky Dice";

  return null;
}

// ---------------- ROLL ----------------
function roll(luck) {
  const c = (chance, name, display) =>
    Math.random() < chance * luck ? { name, display } : null;

  return (
    c(1 / 100000000, "Everything III", "1/100M") ||
    c(1 / 10000000, "Everything II", "1/10M") ||
    c(1 / 5000000, "Everything I", "1/5M") ||

    c(1 / 2000000, "Deep Research III", "1/2M") ||
    c(1 / 1000000, "Deep Research II", "1/1M") ||
    c(1 / 750000, "Deep Research I", "1/750K") ||

    c(1 / 500000, "Automation III", "1/500K") ||
    c(1 / 250000, "Automation II", "1/250K") ||
    c(1 / 150000, "Automation I", "1/150K") ||

    c(1 / 100000, "Tier III", "1/100K") ||
    c(1 / 75000, "Tier II", "1/75K") ||
    c(1 / 50000, "Tier I", "1/50K") ||

    c(1 / 30000, "Dark Part III", "1/30K") ||
    c(1 / 15000, "Dark Part II", "1/15K") ||
    c(1 / 7000, "Dark Part I", "1/7K") ||

    c(1 / 4000, "Rainbow Part III", "1/4K") ||
    c(1 / 2000, "Rainbow Part II", "1/2K") ||
    c(1 / 1000, "Rainbow Part I", "1/1K") ||

    c(1 / 600, "Gold Part III", "1/600") ||
    c(1 / 300, "Gold Part II", "1/300") ||
    c(1 / 150, "Gold Part I", "1/150") ||

    c(1 / 75, "Reset III", "1/75") ||
    c(1 / 40, "Reset II", "1/40") ||
    c(1 / 20, "Reset I", "1/20") ||

    c(1 / 10, "Part III", "1/10") ||
    c(1 / 6, "Part II", "1/6") ||

    { name: "Part I", display: "1/3" }
  );
}

// ---------------- EFFECTS ----------------
function getEffect(name) {
  const v = points[name] || 0;
  if (v >= 7500) return { color: 0xFF00FF, title: "🌌 MYTHIC DROP!" };
  if (v >= 2500) return { color: 0xFF4500, title: "🔥 LEGENDARY DROP!" };
  if (v >= 1000) return { color: 0x00FFFF, title: "⚡ EPIC DROP!" };
  if (v >= 500) return { color: 0xFFD700, title: "✨ RARE DROP!" };
  if (v >= 100) return { color: 0x00FF00, title: "💠 UNCOMMON DROP!" };
  return { color: COLOR, title: "🎲 Roll Result" };
}

// ---------------- AUTOROLL (FULL RESTORE) ----------------
async function autorollLoop(id) {
  const u = getUser(id);
  if (!u.autorollEnabled) return;

  let base = 10000;

  // rebirth scaling (-1s after rebirth 3, capped at 5s min delay)
  let reduction = u.rebirths >= 3 ? (u.rebirths - 2) * 1000 : 0;
  let delay = Math.max(5000, base - reduction);

  setTimeout(async () => {
    if (!u.autorollEnabled) return;

    const r = roll(getLuck(u.level, u.rebirths));

    u.rolls++;
    u.xp += (points[r.name] || 1) * getXpMultiplier(u.rebirths);

    u.owned[r.name] = (u.owned[r.name] || 0) + 1;

    if (!u.rarest || (points[r.name] || 0) > (points[u.rarest] || 0)) {
      u.rarest = r.name;
    }

    while (u.xp >= xpNeeded(u.level)) {
      u.xp -= xpNeeded(u.level);
      u.level++;
    }

    saveData();
    autorollLoop(id);
  }, delay);
}

// ---------------- MESSAGE HANDLER ----------------
client.on("messageCreate", async (msg) => {
  if (!msg.guild || msg.author.bot) return;

  const isAdmin = msg.member?.permissions?.has(PermissionFlagsBits.Administrator);
  if (msg.channel.id !== CHANNEL_ID && !isAdmin) return;

  const u = getUser(msg.author.id);

  // ================= ROLL =================
  if (msg.content === "?roll") {
    const boost = activeBoost[msg.author.id] || 1;
    delete activeBoost[msg.author.id];

    const luck = getLuck(u.level, u.rebirths) * boost;

    let anim = await msg.reply("🎲 Rolling...");
    const frames = ["🎲", "🎲.", "🎲..", "🎲..."];

    for (const f of frames) {
      await new Promise(r => setTimeout(r, 350));
      await anim.edit(f);
    }

    const r = roll(luck);

    u.rolls++;
    u.xp += points[r.name] || 1;
    u.owned[r.name] = (u.owned[r.name] || 0) + 1;

    let leveled = false;
    while (u.xp >= xpNeeded(u.level)) {
      u.xp -= xpNeeded(u.level);
      u.level++;
      leveled = true;
    }

    const effect = getEffect(r.name);

    const embed = new EmbedBuilder()
      .setColor(effect.color)
      .setTitle(effect.title)
      .addFields(
        { name: "✨ Result", value: `${r.name} (${r.display})` },
        { name: "📊 Level", value: `${u.level} | XP ${u.xp}/${xpNeeded(u.level)}` },
        { name: "⚡ Rolls", value: `${u.rolls}` }
      );

    if (leveled) embed.addFields({ name: "⬆️ Level Up!", value: "YES" });

    await anim.edit({ embeds: [embed], content: "" });

    return;
  }

  // ================= REBIRTH =================
  if (msg.content === "?rebirth") {
    const req = Math.floor(1000 * Math.pow(2.5, u.rebirths));
    if (u.rolls < req) return msg.reply(`Need ${req} rolls`);

    u.rebirths++;

    // milestone 1
    if (u.rebirths === 1) {
      u.autorollEnabled = true;
      autorollLoop(msg.author.id);
    }

    // milestone 3+
    if (u.rebirths >= 3 && !u.autorollRunning) {
      u.autorollRunning = true;
      autorollLoop(msg.author.id);
    }

    u.level = 1;
    u.xp = 0;
    u.rolls = 0;

    saveData();

    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle("🔄 REBIRTH COMPLETED")
      .addFields(
        { name: "Rebirths", value: `${u.rebirths}` },
        {
          name: "Milestones",
          value:
            u.rebirths === 1
              ? "✔ Autoroll unlocked (10s)"
              : u.rebirths === 2
              ? "✔ XP multiplier unlocked (1.5x scaling)"
              : u.rebirths >= 3
              ? "✔ Autoroll speed scaling active"
              : "None"
        }
      );

    return msg.reply({ embeds: [embed] });
  }

  // ================= INVENTORY =================
  if (msg.content === "?inv") {
    const inv = u.inventory;

    return msg.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR)
          .setTitle("🎒 Inventory")
          .setDescription(
            `🎲 Lucky Dice: ${inv["Lucky Dice"]}\n` +
            `🥇 Golden Dice: ${inv["Golden Lucky Dice"]}\n` +
            `💎 Diamond Dice: ${inv["Diamond Lucky Dice"]}\n` +
            `🌌 Cosmic Dice: ${inv["Cosmic Lucky Dice"]}`
          )
      ]
    });
  }

  // ================= LEADERBOARD =================
  if (msg.content === "?leaderboard") {
    const entries = Object.entries(userData);

    const getName = (id) =>
      msg.guild.members.cache.get(id)?.displayName || "Unknown";

    const topRolls = entries
      .sort((a, b) => b[1].rolls - a[1].rolls)
      .slice(0, 5)
      .map((x, i) => `${i + 1}. ${getName(x[0])} - ${x[1].rolls}`)
      .join("\n");

    const topLevels = entries
      .sort((a, b) => b[1].level - a[1].level)
      .slice(0, 5)
      .map((x, i) => `${i + 1}. ${getName(x[0])} - ${x[1].level}`)
      .join("\n");

    return msg.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR)
          .setTitle("📊 Leaderboards")
          .addFields(
            { name: "🔁 Rolls", value: topRolls || "None" },
            { name: "⭐ Levels", value: topLevels || "None" }
          )
      ]
    });
  }

  // ================= ADMIN FIXED =================
  if (msg.content.startsWith("?setrolls") && isAdmin) {
    const user = msg.mentions.users.first();
    const amount = parseInt(msg.content.split(" ")[2]);
    getUser(user.id).rolls = amount;
    saveData();
    return msg.reply("Updated rolls");
  }

  if (msg.content.startsWith("?setlevel") && isAdmin) {
    const user = msg.mentions.users.first();
    const amount = parseInt(msg.content.split(" ")[2]);
    getUser(user.id).level = amount;
    saveData();
    return msg.reply("Updated level");
  }

  if (msg.content.startsWith("?setrebirth") && isAdmin) {
    const user = msg.mentions.users.first();
    const amount = parseInt(msg.content.split(" ")[2]);
    getUser(user.id).rebirths = amount;
    saveData();
    return msg.reply("Updated rebirths");
  }
});

client.login(process.env.TOKEN);
