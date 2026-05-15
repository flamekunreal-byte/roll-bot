const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

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
  ]
});

// ================= DATA =================
let userData = {};
let pendingRebirth = {};
let activeBoost = {};
let autorollIntervals = {};
let autorollLogs = {};
let lastSeen = {};

// ================= ROLE REWARDS =================
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

// ================= SAVE =================
function loadData() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}");
  userData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "{}");
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
}

loadData();

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

// ================= XP =================
function xpNeeded(lv) {
  return Math.floor(5 * Math.pow(1.5, lv - 1));
}

// ================= LUCK =================
function getLuck(level, rebirths) {
  return Math.pow(1.2, level - 1) * Math.pow(2, rebirths);
}

// ================= POINTS =================
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

// ================= DICE =================
function giveDice(user) {
  const r = Math.random();

  if (r < 0.0001) {
    user.inventory["Cosmic Lucky Dice"]++;
    return "🌌 Cosmic Dice";
  }

  if (r < 0.001) {
    user.inventory["Diamond Lucky Dice"]++;
    return "💎 Diamond Dice";
  }

  if (r < 0.01) {
    user.inventory["Golden Lucky Dice"]++;
    return "🥇 Golden Dice";
  }

  if (r < 0.05) {
    user.inventory["Lucky Dice"]++;
    return "🎲 Lucky Dice";
  }

  return null;
}

// ================= ROLL =================
function roll(luck) {
  const c = (p, n, d) =>
    Math.random() < p * luck
      ? { name: n, display: d }
      : null;

  return (
    c(1e-8, "Everything III", "1/100M") ||
    c(1e-7, "Everything II", "1/10M") ||
    c(5e-7, "Everything I", "1/5M") ||
    c(2e-6, "Deep Research III", "1/2M") ||
    c(1e-6, "Deep Research II", "1/1M") ||
    c(7.5e-6, "Deep Research I", "1/750K") ||
    c(5e-6, "Automation III", "1/500K") ||
    c(2.5e-5, "Automation II", "1/250K") ||
    c(1.5e-5, "Automation I", "1/150K") ||
    c(1e-4, "Tier III", "1/100K") ||
    c(7.5e-4, "Tier II", "1/75K") ||
    c(5e-4, "Tier I", "1/50K") ||
    { name: "Part I", display: "1/3" }
  );
}

// ================= EFFECT =================
function effect(n) {
  const v = points[n] || 0;

  if (v >= 7500) return { color: 0xFF00FF };
  if (v >= 2500) return { color: 0xFF4500 };
  if (v >= 1000) return { color: 0x00FFFF };
  if (v >= 500) return { color: 0xFFD700 };

  return { color: COLOR };
}

// ================= AUTOROLL =================
function startAutoroll(id) {
  const u = getUser(id);

  if (u.rebirths < 1) return;
  if (autorollIntervals[id]) return;

  autorollIntervals[id] = setInterval(() => {
    const u = getUser(id);

    const luck = getLuck(u.level, u.rebirths);
    const r = roll(luck);

    u.rolls++;
    u.xp += points[r.name] || 1;
    u.owned[r.name] = (u.owned[r.name] || 0) + 1;

    if (!autorollLogs[id]) autorollLogs[id] = [];

    autorollLogs[id].push(r);

    saveData();
  }, 10000);
}

// ================= BOT =================
client.on("messageCreate", async (msg) => {
  try {
    if (!msg.guild || msg.author.bot) return;

    const id = msg.author.id;
    const u = getUser(id);

    const isAdmin = msg.member.permissions.has(
      PermissionFlagsBits.Administrator
    );

    lastSeen[id] = Date.now();

    // ================= HELP =================
    if (msg.content === "?help") {
      return msg.reply(`
?roll
?stats
?profile
?inv
?use
?rebirth
?leaderboard
      `);
    }

    // ================= ROLL =================
    if (msg.content === "?roll") {
      if (u.rebirths >= 1) {
        startAutoroll(id);
      }

      const boost = activeBoost[id] || 1;
      delete activeBoost[id];

      const luck = getLuck(u.level, u.rebirths) * boost;

      let anim = await msg.reply("🎲 Rolling...");

      const r = roll(luck);

      u.rolls++;

      const gain = points[r.name] || 1;

      u.xp += gain;

      u.owned[r.name] = (u.owned[r.name] || 0) + 1;

      if (
        !u.rarest ||
        (points[r.name] || 0) > (points[u.rarest] || 0)
      ) {
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

      const e = effect(r.name);

      const embed = new EmbedBuilder()
  .setColor(e.color)
  .setTitle("🎲 Roll Result 🎲")
  .addFields(
    {
      name: "✨Result✨",
      value: `${r.name} [${r.display}]`,
      inline: false
    },
    {
      name: "📈Progress📈",
      value:
        `⭐Level: ${u.level}\n` +
        `XP: ${u.xp}/${xpNeeded(u.level)} [+${gain}]`,
      inline: false
    },
    {
      name: "⚡Roll Stats⚡",
      value:
        `🔁Rolls: ${u.rolls}\n` +
        `🍀Luck: x${luck.toFixed(2)}`,
      inline: false
    }
  )
  .setFooter({
    text:
      `RNG System Luck Engine Active • ` +
      `${new Date().toLocaleTimeString()}`
  })
  .setTimestamp();

      if (dice) {
        embed.addFields({
          name: "🎁 Dice",
          value: dice
        });
      }

      if (leveled) {
        embed.addFields({
          name: "⬆️ Level Up",
          value: "LEVEL UP!"
        });
      }

      await anim.edit({
        content: "",
        embeds: [embed]
      });

      const role = roleRewards[r.name];

      if (role) {
        msg.member.roles.add(role).catch(() => {});
      }

      return;
    }

    // ================= STATS =================
    if (msg.content === "?stats") {
      return msg.reply(`
⭐ Level: ${u.level}
XP: ${u.xp}/${xpNeeded(u.level)}
🎲 Rolls: ${u.rolls}
🔄 Rebirths: ${u.rebirths}
      `);
    }

    // ================= PROFILE =================
    if (msg.content.startsWith("?profile")) {
      const target =
        msg.mentions.users.first() || msg.author;

      const p = getUser(target.id);

      return msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(`📊 ${target.username}`)
            .addFields(
              {
                name: "⭐ Level",
                value: `${p.level}`,
                inline: true
              },
              {
                name: "🎲 Rolls",
                value: `${p.rolls}`,
                inline: true
              },
              {
                name: "🔄 Rebirths",
                value: `${p.rebirths}`,
                inline: true
              },
              {
                name: "💎 Rarest",
                value: p.rarest || "None"
              }
            )
        ]
      });
    }

    // ================= INVENTORY =================
    if (msg.content === "?inv") {
      const i = u.inventory;

      return msg.reply(`
🎲 Lucky: ${i["Lucky Dice"]}
🥇 Golden: ${i["Golden Lucky Dice"]}
💎 Diamond: ${i["Diamond Lucky Dice"]}
🌌 Cosmic: ${i["Cosmic Lucky Dice"]}
      `);
    }

    // ================= USE =================
    if (msg.content.startsWith("?use")) {
      const type = msg.content
        .slice(4)
        .trim()
        .toLowerCase();

      const boosts = {
        "lucky dice": 5,
        "golden lucky dice": 25,
        "diamond lucky dice": 100,
        "cosmic lucky dice": 1000
      };

      const key = Object.keys(boosts).find(
        (k) => k === type
      );

      if (!key) {
        return msg.reply("❌ Invalid item");
      }

      if (u.inventory[key] <= 0) {
        return msg.reply("❌ None left");
      }

      u.inventory[key]--;

      activeBoost[id] = boosts[key];

      saveData();

      return msg.reply(`⚡ Used ${key}`);
    }

    // ================= REBIRTH =================
    if (msg.content === "?rebirth") {
      const req = Math.floor(
        1000 * Math.pow(2.5, u.rebirths)
      );

      if (u.rolls < req) {
        return msg.reply(`Need ${req} rolls`);
      }

      pendingRebirth[id] = true;

      return msg.reply(
        "Type `?rebirth confirm` to rebirth."
      );
    }

    if (msg.content === "?rebirth confirm") {
      if (!pendingRebirth[id]) return;

      u.rebirths++;
      u.level = 1;
      u.xp = 0;
      u.rolls = 0;

      pendingRebirth[id] = false;

      saveData();

      return msg.reply("✅ Rebirth complete");
    }

    // ================= ADMIN =================
    if (isAdmin) {
      if (msg.content.startsWith("?setrolls")) {
        const user = msg.mentions.users.first();
        const amt = parseInt(msg.content.split(" ")[2]);

        getUser(user.id).rolls = amt;

        saveData();

        return msg.reply("done");
      }
    }

  } catch (err) {
    console.error(err);
    msg.reply("An error occurred.");
  }
});

    // ================= LEADERBOARD =================
    if (msg.content === "?leaderboard") {

      const entries = Object.entries(userData);

      const getName = (id) =>
        msg.guild.members.cache.get(id)?.displayName || "Unknown";

      const getRarestCount = (u) => {
        if (!u.rarest) return 0;
        return u.owned?.[u.rarest] || 0;
      };

      const tops = [...entries]
        .sort((a, b) => b[1].rolls - a[1].rolls)
        .slice(0, 5)
        .map((x, i) =>
          `${i + 1}. 🎲 ${getName(x[0])} — ${x[1].rolls.toLocaleString()}`
        )
        .join("\n");

      return msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle("📊 Leaderboards")
            .addFields({
              name: "🎲 Total Rolls",
              value: tops || "None"
            })
        ]
      });
    }

  } catch (err) {
    console.error(err);
    msg.reply("An error occurred.");
  }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
