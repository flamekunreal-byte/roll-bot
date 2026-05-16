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

function formatNumber(num) {
  if (num === null || num === undefined) return "0";

  const abs = Math.abs(num);

  if (abs >= 1e12) return (num / 1e12).toFixed(2).replace(/\.00$/, "") + "T";
  if (abs >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
  if (abs >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
  if (abs >= 1e3) return (num / 1e3).toFixed(2).replace(/\.00$/, "") + "K";

  return num.toString();
}

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
  "Everything III": "1504751748986962030",

  "Eternal I": "1505140670250090536",
  "Eternal II": "1505140707420143698",
  "Eternal III": "1505140744267104296"
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
      },

      forges: {}
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

  "Eternal I": 5000,
  "Eternal II": 7500,
  "Eternal III": 10000,

  "Everything I": 15000,
  "Everything II": 25000,
  "Everything III": 50000
};

//====== FORGE BOOST TABLE ======
const forgeBoosts = {
  "Reset I": { type: "luck", value: 2.5 },
  "Gold Part I": { type: "luck", value: 2.5 },

  "Rainbow Part I": { type: "rolls", value: 2 },
  "Tier I": { type: "rolls", value: 2 },
  "Everything I": { type: "rolls", value: 2 },

  "Dark Part I": { type: "resource", value: 1.5 },
  "Automation I": { type: "resource", value: 1.5 },

  "Deep Research I": { type: "luck", value: 4 },
  "Eternal I": { type: "luck", value: 3 }
};

// ===== CRAFTING SYSTEM =====
const forgeRecipes = {
  "Reset I": {
    type: "luck",
    boost: 2.5,
    cost: 10,
    desc: "2.5x Luck"
  },
  "Gold Part I": {
    type: "luck",
    boost: 2.5,
    cost: 10,
    desc: "2.5x Luck"
  },
  "Rainbow Part I": {
    type: "roll",
    boost: 2,
    cost: 10,
    desc: "+2 Rolls per roll"
  },
  "Dark Part I": {
    type: "resource",
    boost: 1.5,
    cost: 10,
    desc: "1.5x Resource gain"
  },
  "Tier I": {
    type: "roll",
    boost: 2,
    cost: 10,
    desc: "+2 Rolls per roll"
  },
  "Automation I": {
    type: "resource",
    boost: 1.5,
    cost: 10,
    desc: "1.5x Resource gain"
  },
  "Deep Research I": {
    type: "luck",
    boost: 4,
    cost: 10,
    desc: "4x Luck"
  },
  "Eternal I": {
    type: "luck",
    boost: 3,
    cost: 10,
    desc: "3x Luck"
  },
  "Everything I": {
    type: "roll",
    boost: 2,
    cost: 10,
    desc: "+2 Rolls per roll"
  }
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
    Math.random() < Math.min(p * luck, 1)
      ? { name: n, display: d }
      : null;

  return (

    // ===== EVERYTHING (RARER THAN ETERNAL) =====
    c(1e-12, "Everything III", "1/1T") ||
    c(2e-11, "Everything II", "1/50B") ||
    c(4e-10, "Everything I", "1/2.5B") ||

    // ===== ETERNAL =====
    c(1e-9, "Eternal III", "1/1B") ||
    c(1e-8, "Eternal II", "1/100M") ||
    c(2e-7, "Eternal I", "1/5M") ||

    // ===== DEEP RESEARCH =====
    c(5e-7, "Deep Research III", "1/2M") ||
    c(1e-6, "Deep Research II", "1/1M") ||
    c(1.333333e-6, "Deep Research I", "1/750K") ||

    // ===== AUTOMATION =====
    c(2e-6, "Automation III", "1/500K") ||
    c(4e-6, "Automation II", "1/250K") ||
    c(6.666666e-6, "Automation I", "1/150K") ||

    // ===== TIER =====
    c(1e-5, "Tier III", "1/100K") ||
    c(1.333333e-5, "Tier II", "1/75K") ||
    c(2e-5, "Tier I", "1/50K") ||

    // ===== DARK PART =====
    c(3.333333e-5, "Dark Part III", "1/30K") ||
    c(6.666666e-5, "Dark Part II", "1/15K") ||
    c(1.428571e-4, "Dark Part I", "1/7K") ||

    // ===== RAINBOW PART =====
    c(2.5e-4, "Rainbow Part III", "1/4K") ||
    c(5e-4, "Rainbow Part II", "1/2K") ||
    c(1e-3, "Rainbow Part I", "1/1K") ||

    // ===== GOLD PART =====
    c(1.666666e-3, "Gold Part III", "1/600") ||
    c(3.333333e-3, "Gold Part II", "1/300") ||
    c(6.666666e-3, "Gold Part I", "1/150") ||

    // ===== RESET =====
    c(1.333333e-2, "Reset III", "1/75") ||
    c(2.5e-2, "Reset II", "1/40") ||
    c(5e-2, "Reset I", "1/20") ||

    // ===== PART =====
    c(0.1, "Part III", "1/10") ||
    c(0.1666666, "Part II", "1/6") ||

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

  // requires rebirth 1
  if (u.rebirths < 1) return;

  // prevent duplicate intervals
  if (autorollIntervals[id]) return;

  // speed scaling
  let speed = 10000;

  if (u.rebirths >= 3) {

    const reduction =
      Math.min(u.rebirths - 2, 5);

    speed -= reduction * 1000;
  }

  autorollIntervals[id] = setInterval(() => {

    const u = getUser(id);

    const boost = activeBoost[id] || 1;

    const luck =
      getLuck(u.level, u.rebirths) * boost;

    const r = roll(luck);

    // roll count
    u.rolls++;

    // xp gain
    const gain = points[r.name] || 1;

    // rebirth xp multiplier
    const xpMulti =
      u.rebirths >= 2
        ? 1 + (u.rebirths * 0.5)
        : 1;

    const totalXP = Math.floor(gain * xpMulti);

    u.xp += totalXP;

    // owned
    u.owned[r.name] =
      (u.owned[r.name] || 0) + 1;

    // rarest tracking
    if (
      !u.rarest ||
      (points[r.name] || 0) >
      (points[u.rarest] || 0)
    ) {
      u.rarest = r.name;
    }

    // level system
    let levelUps = 0;

    while (u.xp >= xpNeeded(u.level)) {

      u.xp -= xpNeeded(u.level);

      u.level++;

      levelUps++;
    }

    // dice drops
    giveDice(u, luck);

    // autoroll logs
    if (!autorollLogs[id]) {
      autorollLogs[id] = [];
    }

    autorollLogs[id].push({
      ...r,
      gain: totalXP,
      levels: levelUps
    });

saveData();

}, speed);
}

// ================= BOT =================
client.on("messageCreate", async (msg) => {
  try {

    // ignore bots + DMs
    if (!msg.guild || msg.author.bot) return;

    // ================= CHANNEL LOCK =================
    const allowedChannel = "1504547166088069181";

    // only allow bot commands in this channel
    if (msg.channel.id !== allowedChannel) {
      return;
    }

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

let boost = 1;

if (activeBoost[id]?.length > 0) {
  boost = activeBoost[id].shift();
}

// ===== FORGE LOOP (PERMANENT UPGRADES) =====
let luck = getLuck(u.level, u.rebirths) * boost;
let extraRolls = 0;

if (u.forges) {
  for (const f of Object.values(u.forges)) {

    if (!f) continue;

    if (f.type === "luck") {
      luck *= f.boost;
    }

    if (f.type === "roll") {
      extraRolls += f.boost;
    }
  }
}
     // ========ROLL==========

      let anim = await msg.reply("🎲 Rolling...");

      const r = roll(luck);

      u.rolls += 1 + extraRolls;

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
     
        // ================= AUTOROLL SUMMARY ON MANUAL ROLL =================
if (autorollLogs[id] && autorollLogs[id].length > 0) {

  const logs = autorollLogs[id];
  autorollLogs[id] = [];

  let totalRolls = logs.length;
  let pointsGained = 0;
  let totalLevels = 0;
  let highest = null;

  for (const r of logs) {
    pointsGained += r.gain || 0;
    totalLevels += r.levels || 0;

    if (!highest || (points[r.name] || 0) > (points[highest.name] || 0)) {
      highest = r;
    }
  }

  const channel = client.channels.cache.get(CHANNEL_ID);

  if (channel) {
const embed = new EmbedBuilder()
  .setColor(0xFFDE10)
  .setTitle("⏳ Auto Roll Summary")
  .addFields(
    {
      name: "🎲 Times Rolled",
      value: `${formatNumber(totalRolls)}`,
      inline: true
    },
    {
      name: "💎 Rarest Roll",
      value:
        highest
          ? `${highest.name} (${highest.display})\nCount: ${formatNumber(u.owned[highest.name] || 0)}`
          : "None",
      inline: true
    },
    {
      name: "📈 Points Gained",
      value: `${formatNumber(pointsGained)}`,
      inline: true
    },
    {
      name: "⭐ Levels Gained",
      value: `${formatNumber(totalLevels)}`,
      inline: true
    }
  )
  .setFooter({ text: "Autoroll System" })
  .setTimestamp();

    channel.send({ embeds: [embed] }).catch(() => {});
  }
}
      }

      return;
    }

    // ================= STATS =================
if (msg.content === "?stats") {
  return msg.reply(`
⭐ Level: ${u.level}
XP: ${formatNumber(u.xp)}/${formatNumber(xpNeeded(u.level))}
🎲 Rolls: ${formatNumber(u.rolls)}
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
  value: `${formatNumber(p.rolls)}`,
  inline: true
},
{
  name: "🔄 Rebirths",
  value: `${p.rebirths}`,
  inline: true
},
{
  name: "💎 Rarest",
  value: p.rarest || "None",
  inline: false
}
            )
        ]
      });
    }
// ================= INVENTORY =================
if (msg.content === "?inv") {

  const i = u.inventory;

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`🎒 ${msg.author.username}'s Inventory`)
    .setDescription("Your collected dice items:")
    .addFields(
     {
  name: "🎲 Lucky Dice",
  value: `${formatNumber(i["Lucky Dice"])}`
},
{
  name: "🥇 Golden Lucky Dice",
  value: `${formatNumber(i["Golden Lucky Dice"])}`
},
{
  name: "💎 Diamond Lucky Dice",
  value: `${formatNumber(i["Diamond Lucky Dice"])}`
},
{
  name: "🌌 Cosmic Lucky Dice",
  value: `${formatNumber(i["Cosmic Lucky Dice"])}`
}
    )
    .addFields({
      name: "⚡ How to Use",
      value: "`?use lucky | golden | diamond | cosmic`"
    })
    .setFooter({ text: "Inventory System" })
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}

// ================= USE =================
if (msg.content.startsWith("?use")) {

  const args = msg.content
    .slice(4)
    .trim()
    .toLowerCase()
    .split(" ");

  let amount = 1;

  // detect number at start
  if (!isNaN(args[0])) {
    amount = parseInt(args[0]);
    args.shift();
  }

  const input = args.join(" ");

  const items = {
    lucky: {
      aliases: [
        "lucky",
        "lucky dice",
        "luckydice"
      ],
      name: "Lucky Dice",
      boost: 5
    },

    golden: {
      aliases: [
        "golden",
        "golden dice",
        "golden lucky dice",
        "goldendice"
      ],
      name: "Golden Lucky Dice",
      boost: 25
    },

    diamond: {
      aliases: [
        "diamond",
        "diamond dice",
        "diamond lucky dice",
        "diamonddice"
      ],
      name: "Diamond Lucky Dice",
      boost: 100
    },

    cosmic: {
      aliases: [
        "cosmic",
        "cosmic dice",
        "cosmic lucky dice",
        "cosmicdice"
      ],
      name: "Cosmic Lucky Dice",
      boost: 1000
    }
  };

  let found = null;

  for (const key in items) {

    if (items[key].aliases.includes(input)) {
      found = items[key];
      break;
    }
  }

  if (!found) {

    return msg.reply(
      "❌ Invalid item.\nUse: lucky, golden, diamond, cosmic"
    );
  }

  // invalid amount
  if (amount <= 0 || isNaN(amount)) {
    return msg.reply(
      "❌ Invalid amount"
    );
  }

  // inventory check
  if (
    !u.inventory[found.name] ||
    u.inventory[found.name] < amount
  ) {
    return msg.reply(
      `❌ You only have ${u.inventory[found.name] || 0} ${found.name}`
    );
  }

  // consume dice
  u.inventory[found.name] -= amount;

  // queue boosts
  if (!activeBoost[id]) {
    activeBoost[id] = [];
  }

  for (let i = 0; i < amount; i++) {
    activeBoost[id].push(found.boost);
  }

  saveData();

  const embed = new EmbedBuilder()
    .setColor(0xFFDE10)
    .setTitle("⚡ Dice Activated")
    .setDescription(
      `Queued **${amount}x ${found.name}**`
    )
    .addFields(
      {
        name: "🍀 Luck Per Roll",
        value: `x${found.boost}`,
        inline: true
      },
      {
        name: "🎲 Rolls Boosted",
        value: `${amount}`,
        inline: true
      },
      {
        name: "🎒 Remaining",
        value: `${u.inventory[found.name]}`,
        inline: true
      }
    )
    .setFooter({
      text: "Boost applies automatically on future rolls"
    })
    .setTimestamp();

  return msg.reply({
    embeds: [embed]
  });
}
 // ================= FORGE UI =================
if (msg.content.toLowerCase() === "?forgerecipes") {

  const list = Object.entries(forgeRecipes)
    .map(([name, r]) => {
      return `**${name}**
Type: ${r.type}
Cost: ${r.cost}
Effect: ${r.desc}`;
    })
    .join("\n\n");

  return msg.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xFFDE10)
        .setTitle("⚒️ Forge Recipes")
        .setDescription(list)
    ]
  });
}
    
// ================= FORGE =================
if (msg.content.startsWith("?forge ")) {

  const item = msg.content.slice(7).trim();
  const u = getUser(msg.author.id);

  const recipe = forgeRecipes[item];

  if (!recipe) {
    return msg.reply("❌ Invalid forge item");
  }

  const inv = u.owned[item] || 0;

  if (inv < recipe.cost) {
    return msg.reply(
      `❌ Need ${recipe.cost}x ${item} (you have ${inv})`
    );
  }

  // consume items
  u.owned[item] -= recipe.cost;

// apply forge (ONE TIME ONLY)
if (u.forges[item]) {
  return msg.reply("❌ Already forged");
}

u.forges[item] = {
  type: recipe.type,
  boost: recipe.boost
};

  // save forge
  u.forges[item] = {
    type: recipe.type,
    boost: recipe.boost
  };

  saveData();

  return msg.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xFFDE10)
        .setTitle("⚒️ Forge Successful")
        .addFields(
          {
            name: "Upgrade",
            value: item,
            inline: false
          },
          {
            name: "Type",
            value: recipe.type,
            inline: true
          },
          {
            name: "Boost",
            value:
              recipe.type === "roll"
                ? `+${recipe.boost} rolls`
                : `${recipe.boost}x ${recipe.type}`,
            inline: true
          }
        )
    ]
  });
}
    
  // ================= REBIRTH =================
if (msg.content === "?rebirth") {

  const req = Math.floor(1000 * Math.pow(2.5, u.rebirths));

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🔄 Rebirth System")
    .setDescription(
`Rebirth at **${formatNumber(req)}** rolls

🔓 Rebirth 1:
• Unlock Autoroll (10s)

⭐ Rebirth 2:
• XP multiplier x1.5 per rebirth

⚡ Rebirth 3+:
• Autoroll speed improves by -1s
• Max reduction: 5s total
• Minimum autoroll speed: 5s`
    )
    .addFields({
      name: "📊 Your Progress",
      value:
`🎲 Rolls: ${formatNumber(u.rolls)}/${formatNumber(req)}
🔄 Current Rebirths: ${u.rebirths}`
    })
    .setFooter({
      text: "Type ?rebirth confirm to rebirth"
    });

  return msg.reply({
    embeds: [embed]
  });
}
    
// ================= REBIRTH CONFIRM =================
if (msg.content === "?rebirth confirm") {

  const req = Math.floor(1000 * Math.pow(2.5, u.rebirths));

  if (u.rolls < req) {
    return msg.reply(
      `❌ You need ${req.toLocaleString()} rolls to rebirth`
    );
  }

  u.rebirths++;

  u.level = 1;
  u.xp = 0;
  u.rolls = 0;

  saveData();

  return msg.reply(
    `✅ Rebirth successful! You are now Rebirth ${u.rebirths}`
  );
}
    
   // ================= ADMIN =================
if (isAdmin) {

  // SET ROLLS
  if (msg.content.startsWith("?setrolls")) {

    const user = msg.mentions.users.first();
    const amt = parseInt(msg.content.split(" ")[2]);

    if (!user || isNaN(amt))
      return msg.reply("Usage: ?setrolls @user amount");

    getUser(user.id).rolls = amt;

    saveData();

    return msg.reply("✅ Rolls updated");
  }

  // SET LEVEL
  if (msg.content.startsWith("?setlevel")) {

    const user = msg.mentions.users.first();
    const amt = parseInt(msg.content.split(" ")[2]);

    if (!user || isNaN(amt))
      return msg.reply("Usage: ?setlevel @user amount");

    getUser(user.id).level = amt;

    saveData();

    return msg.reply("✅ Level updated");
  }

  // SET REBIRTHS
  if (msg.content.startsWith("?setrebirth")) {

    const user = msg.mentions.users.first();
    const amt = parseInt(msg.content.split(" ")[2]);

    if (!user || isNaN(amt))
      return msg.reply("Usage: ?setrebirth @user amount");

    getUser(user.id).rebirths = amt;

    saveData();

    return msg.reply("✅ Rebirths updated");
  }

  // GIVE ITEM
  if (msg.content.startsWith("?giveitem")) {

    const args = msg.content.split(" ");

    const user = msg.mentions.users.first();

    const item = args.slice(2, -1).join(" ");

    const amt = parseInt(args[args.length - 1]);

    if (!user || !item || isNaN(amt))
      return msg.reply(
        "Usage: ?giveitem @user item amount"
      );

    const p = getUser(user.id);

    if (!p.inventory[item])
      p.inventory[item] = 0;

    p.inventory[item] += amt;

    saveData();

    return msg.reply(`✅ Gave ${amt} ${item}`);
  }

  // RESET USER
  if (msg.content.startsWith("?resetuser")) {

    const user = msg.mentions.users.first();

    if (!user)
      return msg.reply("Usage: ?resetuser @user");

    delete userData[user.id];

    saveData();

    return msg.reply("✅ User reset");
  }
}

// ================= RAREST LEADERBOARD =================
if (msg.content === "?leaderboard") {

  const entries = Object.entries(userData);

  const getName = (id) =>
    msg.guild.members.cache.get(id)?.displayName || "Unknown";

  const getRarestValue = (u) => {
    if (!u.rarest) return 0;
    return points[u.rarest] || 0;
  };

  const getRarestCount = (u) => {
    if (!u.rarest) return 0;
    return u.owned?.[u.rarest] || 0;
  };

  // ===== FORMAT NUMBER (K/M/B) =====
value: `${formatNumber(totalRolls)}`

  const leaderboard = [...entries]
    .sort((a, b) => {
      const rareDiff =
        getRarestValue(b[1]) - getRarestValue(a[1]);

      if (rareDiff !== 0) return rareDiff;

      return getRarestCount(b[1]) - getRarestCount(a[1]);
    })
    .slice(0, 10)
    .map((x, i) => {
      const u = x[1];

      const rareName = u.rarest || "None";
      const rareValue = points[rareName] || 0;
      const rareCount = u.owned?.[rareName] || 0;

      return (
        `${i + 1}. 💎 ${getName(x[0])}\n` +
        `Rarest: ${rareName} (${formatNumber(rareValue)})\n` +
        `Count: ${formatNumber(rareCount)}`
      );
    })
    .join("\n\n");

  return msg.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("💎 Rarest Roll Leaderboard")
        .setDescription(leaderboard || "No data")
    ]
  });
}

  } catch (err) {
    console.error(err);
    msg.reply("An error occurred.");
  }
});

client.login(process.env.TOKEN);
