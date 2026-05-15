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
let pendingRebirth = {};
let activeBoost = {};

// ---------------- ROLE REWARDS ----------------
const roleRewards = {
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

// ---------------- SAVE ----------------
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

// ---------------- ROLL ----------------
function roll(luck) {
  const check = (c, n, d) =>
    Math.random() < c * luck ? { name: n, display: d } : null;

  return (
    check(1 / 100000000, "Everything III", "1/100M") ||
    check(1 / 10000000, "Everything II", "1/10M") ||
    check(1 / 5000000, "Everything I", "1/5M") ||
    check(1 / 2000000, "Deep Research III", "1/2M") ||
    check(1 / 1000000, "Deep Research II", "1/1M") ||
    check(1 / 750000, "Deep Research I", "1/750K") ||
    check(1 / 500000, "Automation III", "1/500K") ||
    check(1 / 250000, "Automation II", "1/250K") ||
    check(1 / 150000, "Automation I", "1/150K") ||
    check(1 / 100000, "Tier III", "1/100K") ||
    check(1 / 75000, "Tier II", "1/75K") ||
    check(1 / 50000, "Tier I", "1/50K") ||
    check(1 / 30000, "Dark Part III", "1/30K") ||
    check(1 / 15000, "Dark Part II", "1/15K") ||
    check(1 / 7000, "Dark Part I", "1/7K") ||
    check(1 / 4000, "Rainbow Part III", "1/4K") ||
    check(1 / 2000, "Rainbow Part II", "1/2K") ||
    check(1 / 1000, "Rainbow Part I", "1/1K") ||
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

// ---------------- EFFECTS ----------------
function getRarityEffect(name) {
  const v = points[name] || 0;
  if (v >= 7500) return { color: 0xFF00FF, title: "🌌 MYTHIC DROP!" };
  if (v >= 2500) return { color: 0xFF4500, title: "🔥 LEGENDARY DROP!" };
  if (v >= 1000) return { color: 0x00FFFF, title: "⚡ EPIC DROP!" };
  if (v >= 500) return { color: 0xFFD700, title: "✨ RARE DROP!" };
  if (v >= 100) return { color: 0x00FF00, title: "💠 UNCOMMON DROP!" };
  return { color: COLOR, title: "🎲 Roll Result" };
}

// ---------------- AUTOROLL ----------------
async function autorollUser(id) {
  const u = getUser(id);
  if (!u.autorollEnabled) return;

  let base = 10000;
  let reduction = u.rebirths >= 3 ? (u.rebirths - 2) * 1000 : 0;
  const delay = Math.max(5000, base - reduction);

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
    autorollUser(id);
  }, delay);
}

// ---------------- BOT ----------------
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

    const effect = getRarityEffect(r.name);

    const embed = new EmbedBuilder()
      .setColor(effect.color)
      .setTitle(effect.title)
      .addFields(
        { name: "✨ Result", value: `🎲 ${r.name} (${r.display})` },
        { name: "📊 Level", value: `${u.level} | XP ${u.xp}/${xpNeeded(u.level)}` },
        { name: "⚡ Rolls", value: `${u.rolls}` }
      );

    if (leveled) embed.addFields({ name: "⬆️ Level Up!", value: "YES" });

    await anim.edit({ content: "", embeds: [embed] });

    const roleId = roleRewards[r.name];
    if (roleId) try { await msg.member.roles.add(roleId); } catch {}

    return;
  }

  // ================= REBIRTH + MILESTONES =================
  if (msg.content === "?rebirth") {
    const req = Math.floor(1000 * Math.pow(2.5, u.rebirths));
    if (u.rolls < req) return msg.reply(`Need ${req} rolls`);

    u.rebirths++;

    if (u.rebirths === 1) u.autorollEnabled = true;
    if (u.rebirths === 2) {}
    if (u.rebirths >= 3) {
      if (!u.autorollRunning) {
        u.autorollRunning = true;
        autorollUser(msg.author.id);
      }
    }

    u.level = 1;
    u.xp = 0;
    u.rolls = 0;

    saveData();

    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle("🔄 REBIRTH COMPLETED")
      .addFields(
        { name: "Rebirth", value: `${u.rebirths}` },
        {
          name: "Milestones Unlocked",
          value:
            u.rebirths === 1 ? "✔ Autoroll unlocked (10s)" :
            u.rebirths === 2 ? "✔ XP multiplier unlocked (1.5x scaling)" :
            u.rebirths >= 3 ? "✔ Autoroll speed scaling active (-1s per rebirth after 3)" :
            "None"
        }
      );

    return msg.reply({ embeds: [embed] });
  }

  // ================= PROFILE =================
  if (msg.content.startsWith("?profile")) {
    const user = msg.mentions.users.first() || msg.author;
    const p = getUser(user.id);

    return msg.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR)
          .setTitle(`📊 Profile - ${user.username}`)
          .addFields(
            { name: "Level", value: `${p.level}`, inline: true },
            { name: "Rolls", value: `${p.rolls}`, inline: true },
            { name: "Rebirths", value: `${p.rebirths}`, inline: true }
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
