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

// ---------------- SAVE / LOAD ----------------
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

  if (r < 1 / 10000) return user.inventory["Cosmic Lucky Dice"]++, "🌌 Cosmic Lucky Dice";
  if (r < 1 / 2500) return user.inventory["Diamond Lucky Dice"]++, "💎 Diamond Lucky Dice";
  if (r < 1 / 500) return user.inventory["Golden Lucky Dice"]++, "🥇 Golden Lucky Dice";
  if (r < 1 / 50) return user.inventory["Lucky Dice"]++, "🎲 Lucky Dice";

  return null;
}

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

// ---------------- BOT ----------------
client.on("messageCreate", async (msg) => {
  if (!msg.guild || msg.author.bot) return;

  const isAdmin = msg.member?.permissions?.has(PermissionFlagsBits.Administrator);

  // channel lock (admins bypass)
  if (msg.channel.id !== CHANNEL_ID && !isAdmin) return;

  const u = getUser(msg.author.id);

  // ================= ROLL =================
  if (msg.content === "?roll") {

    const boost = activeBoost[msg.author.id] || 1;
    delete activeBoost[msg.author.id];

    const luck = getLuck(u.level, u.rebirths) * boost;
    const r = roll(luck);

    u.rolls++;

    const xpGain = points[r.name] || 1;
    u.xp += xpGain;

    u.owned[r.name] = (u.owned[r.name] || 0) + 1;

    if (!u.rarest || (points[r.name] || 0) > (points[u.rarest] || 0)) {
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

    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle("🎲 Roll Result")
      .addFields(
        { name: "✨ Rarity", value: `🎲 **${r.name}** ︱ ${r.display}` },
        { name: "📊 Progress", value: `⭐ Level: **${u.level}** ︱ 📈 ${u.xp}/${xpNeeded(u.level)} ︱ ➕ +${xpGain} XP` },
        { name: "🔁 Stats", value: `🔁 Rolls: **${u.rolls}** ︱ 🍀 Luck: **x${luck.toFixed(2)}**` }
      );

    if (dice)
      embed.addFields({ name: "🎁 Drop", value: `🎲 You found: **${dice}**` });

    if (leveled)
      embed.addFields({ name: "⬆️ Level Up!", value: "⭐ You leveled up!" });

    return msg.reply({ embeds: [embed] });
  }

  // ================= ADMIN SYSTEM =================
  if (msg.content.startsWith("?")) {

    // only admin commands below
    if (!isAdmin) {

      // ---------- SET ROLLS ----------
      if (msg.content.startsWith("?setrolls")) {
        const user = msg.mentions.users.first();
        const amount = parseInt(msg.content.split(" ")[2]);

        if (!user || isNaN(amount)) return msg.reply("❌ ?setrolls @user <amount>");

        getUser(user.id).rolls = amount;
        saveData();
        return msg.reply(`✅ Set rolls of ${user.username} to ${amount}`);
      }

      // ---------- SET LEVEL ----------
      if (msg.content.startsWith("?setlevel")) {
        const user = msg.mentions.users.first();
        const amount = parseInt(msg.content.split(" ")[2]);

        if (!user || isNaN(amount)) return msg.reply("❌ ?setlevel @user <amount>");

        getUser(user.id).level = amount;
        saveData();
        return msg.reply(`✅ Set level of ${user.username} to ${amount}`);
      }

      // ---------- SET REBIRTH ----------
      if (msg.content.startsWith("?setrebirth")) {
        const user = msg.mentions.users.first();
        const amount = parseInt(msg.content.split(" ")[2]);

        if (!user || isNaN(amount)) return msg.reply("❌ ?setrebirth @user <amount>");

        getUser(user.id).rebirths = amount;
        saveData();
        return msg.reply(`✅ Set rebirths of ${user.username} to ${amount}`);
      }

      // ---------- CHECK ----------
      if (msg.content.startsWith("?check")) {
        const user = msg.mentions.users.first() || msg.author;
        const p = getUser(user.id);

        return msg.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLOR)
              .setTitle(`🔍 Check ${user.username}`)
              .addFields(
                { name: "⭐ Level", value: `${p.level}`, inline: true },
                { name: "🔁 Rolls", value: `${p.rolls}`, inline: true },
                { name: "🔁 Rebirths", value: `${p.rebirths}`, inline: true },
                { name: "💎 Rarest", value: `${p.rarest || "None"}` }
              )
          ]
        });
      }

      // ---------- RESET ----------
      if (msg.content.startsWith("?reset")) {
        const user = msg.mentions.users.first();
        if (!user) return msg.reply("❌ ?reset @user");

        userData[user.id] = {
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

        saveData();
        return msg.reply(`🧨 Reset ${user.username}`);
      }

      // ---------- GIVE DICE ----------
      if (msg.content.startsWith("?give dice")) {
        const args = msg.content.split(" ");
        const user = msg.mentions.users.first();
        const type = args[3];
        const amount = parseInt(args[4]);

        if (!user || !type || isNaN(amount)) {
          return msg.reply("❌ ?give dice @user <type> <amount>");
        }

        const inv = getUser(user.id).inventory;
        if (!inv[type]) return msg.reply("❌ Invalid dice");

        inv[type] += amount;
        saveData();
        return msg.reply(`🎁 Gave ${amount} ${type}`);
      }

      // ---------- REMOVE DICE ----------
      if (msg.content.startsWith("?remove dice")) {
        const args = msg.content.split(" ");
        const user = msg.mentions.users.first();
        const type = args[3];
        const amount = parseInt(args[4]);

        if (!user || !type || isNaN(amount)) {
          return msg.reply("❌ ?remove dice @user <type> <amount>");
        }

        const inv = getUser(user.id).inventory;
        if (!inv[type]) return msg.reply("❌ Invalid dice");

        inv[type] = Math.max(0, inv[type] - amount);
        saveData();
        return msg.reply(`🗑️ Removed ${amount} ${type}`);
      }
    }

    // ---------- ADMIN ONLY ROLLS ----------
    if (msg.content.startsWith("?rolls")) {

      if (!isAdmin) return msg.reply("❌ No permission.");

      const args = msg.content.split(" ");
      const action = args[1];
      const amount = parseInt(args[2]);

      if (!action || isNaN(amount)) {
        return msg.reply("❌ ?rolls add/remove <amount>");
      }

      if (action === "add") {
        u.rolls += amount;
        saveData();
        return msg.reply(`✅ Added ${amount} rolls`);
      }

      if (action === "remove") {
        u.rolls = Math.max(0, u.rolls - amount);
        saveData();
        return msg.reply(`✅ Removed ${amount} rolls`);
      }
    }
  }

  // ================= REBIRTH =================
  if (msg.content === "?rebirth") {
    const req = Math.floor(1000 * Math.pow(2.5, u.rebirths));

    if (u.rolls < req) return msg.reply(`Need ${req} rolls`);

    pendingRebirth[msg.author.id] = true;
    return msg.reply("Type ?rebirth confirm");
  }

  if (msg.content === "?rebirth confirm") {
    if (!pendingRebirth[msg.author.id]) return;

    u.rebirths++;
    u.level = 1;
    u.xp = 0;
    u.rolls = 0;

    pendingRebirth[msg.author.id] = false;
    saveData();

    return msg.reply("Rebirth complete");
  }

  // ================= LEADERBOARD =================
  if (msg.content === "?leaderboard") {

    const getName = id =>
      msg.guild.members.cache.get(id)?.displayName || "Unknown";

    const entries = Object.entries(userData);

    const topRolls = entries
      .sort((a,b)=>b[1].rolls-a[1].rolls)
      .slice(0,5)
      .map((x,i)=>`${i+1}. ${getName(x[0])} - ${x[1].rolls}`)
      .join("\n");

    const topLevels = entries
      .sort((a,b)=>b[1].level-a[1].level)
      .slice(0,5)
      .map((x,i)=>`${i+1}. ${getName(x[0])} - ${x[1].level}`)
      .join("\n");

    const topRare = entries
      .map(x=>{
        const r = x[1].rarest || "None";
        return { id:x[0], rare:r, count:x[1].owned?.[r] || 0 };
      })
      .sort((a,b)=>b.count-a.count)
      .slice(0,5)
      .map((x,i)=>`${i+1}. ${getName(x.id)} - ${x.rare} (${x.count})`)
      .join("\n");

    return msg.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR)
          .setTitle("📊 Leaderboards")
          .addFields(
            { name: "🔁 Rolls", value: topRolls || "None" },
            { name: "⭐ Levels", value: topLevels || "None" },
            { name: "💎 Rarest", value: topRare || "None" }
          )
      ]
    });
  }
});

client.login(process.env.TOKEN);
