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

// ================= MEMORY =================
let userData = {};
let pendingRebirth = {};
let activeBoost = {};

// ================= SAVE =================
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "{}");
    }

    userData = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8") || "{}"
    );

  } catch {
    userData = {};
  }
}

function saveData() {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(userData, null, 2)
  );
}

loadData();

setInterval(saveData, 30000);

process.on("exit", saveData);
process.on("SIGINT", () => {
  saveData();
  process.exit();
});

// ================= XP =================
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

function xpNeeded(level) {
  return Math.floor(
    5 * Math.pow(1.5, level - 1)
  );
}

function getLuck(level, rebirths) {
  return (
    Math.pow(1.2, level - 1) *
    Math.pow(2, rebirths)
  );
}

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

// ================= DICE =================
const boosts = {
  "lucky dice": 5,
  "golden lucky dice": 25,
  "diamond lucky dice": 100,
  "cosmic lucky dice": 1000
};

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

// ================= ROLL =================
function roll(luck) {

  const r = Math.random();

  const check = (
    chance,
    name,
    display
  ) => r < chance * luck
    ? { name, display }
    : null;

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

    { name: "Part I", display: "1/3" }

  );
}

// ================= EMBEDS =================
function createEmbed(title) {

  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle(title);
}

// ================= COMMANDS =================
async function handleRoll(message, user) {

  let boost =
    activeBoost[message.author.id] || 1;

  delete activeBoost[message.author.id];

  const luck =
    getLuck(
      user.level,
      user.rebirths
    ) * boost;

  const result = roll(luck);

  user.rolls++;

  const rarity = result.name;
  const xpGain = points[rarity];

  user.xp += xpGain;

  user.owned[rarity] =
    (user.owned[rarity] || 0) + 1;

  if (
    !user.rarest ||
    user.owned[rarity] >
    (user.owned[user.rarest] || 0)
  ) {
    user.rarest = rarity;
  }

  let leveled = false;

  while (
    user.xp >= xpNeeded(user.level)
  ) {

    user.xp -= xpNeeded(user.level);
    user.level++;
    leveled = true;
  }

  const dice = giveDice(user);

  saveData();

  const embed = createEmbed(
    "🎲 Roll Result"
  );

  embed.addFields(
    {
      name: "Rarity",
      value: `${rarity} [${result.display}]`
    },
    {
      name: "⭐ Level",
      value: `${user.level}`,
      inline: true
    },
    {
      name: "📊 XP",
      value: `${user.xp}/${xpNeeded(user.level)} (+${xpGain})`,
      inline: true
    },
    {
      name: "🍀 Luck",
      value: `x${luck.toFixed(2)}`,
      inline: true
    },
    {
      name: "🔁 Rolls",
      value: `${user.rolls}`,
      inline: true
    }
  );

  if (dice) {
    embed.addFields({
      name: "🎁 Found",
      value: dice
    });
  }

  if (leveled) {
    embed.addFields({
      name: "⬆️ Level Up!",
      value: "You leveled up!"
    });
  }

  return message.reply({
    embeds: [embed]
  });
}

async function handleInventory(message, user) {

  const inv = user.inventory;

  const embed = createEmbed(
    "🎒 Inventory"
  );

  embed.setDescription(
    "Use dice with the commands below."
  );

  embed.addFields(
    {
      name: "🎲 Lucky Dice",
      value: `${inv["Lucky Dice"]}x\n\`?use lucky dice\``,
      inline: true
    },
    {
      name: "🥇 Golden Lucky Dice",
      value: `${inv["Golden Lucky Dice"]}x\n\`?use golden lucky dice\``,
      inline: true
    },
    {
      name: "💎 Diamond Lucky Dice",
      value: `${inv["Diamond Lucky Dice"]}x\n\`?use diamond lucky dice\``,
      inline: true
    },
    {
      name: "🌌 Cosmic Lucky Dice",
      value: `${inv["Cosmic Lucky Dice"]}x\n\`?use cosmic lucky dice\``,
      inline: true
    }
  );

  return message.reply({
    embeds: [embed]
  });
}

async function handleUse(message, user) {

  const input =
    message.content
      .slice(4)
      .trim()
      .toLowerCase();

  const key =
    Object.keys(boosts)
      .find(
        x => x === input
      );

  if (!key) {
    return message.reply(
      "❌ Invalid dice."
    );
  }

  const invKey =
    key
      .split(" ")
      .map(
        x =>
          x.charAt(0).toUpperCase() +
          x.slice(1)
      )
      .join(" ");

  if (
    user.inventory[invKey] <= 0
  ) {
    return message.reply(
      "❌ You don't have this dice."
    );
  }

  user.inventory[invKey]--;

  activeBoost[
    message.author.id
  ] = boosts[key];

  saveData();

  return message.reply(
    `⚡ Used ${invKey} → next roll x${boosts[key]}`
  );
}

async function handleLeaderboard(message) {

  const entries =
    Object.entries(userData);

  const getName = id =>
    message.guild
      .members.cache.get(id)
      ?.displayName || "Unknown";

  const topRolls =
    [...entries]
      .sort(
        (a,b) =>
          b[1].rolls - a[1].rolls
      )
      .slice(0,5)
      .map(
        (x,i) =>
          `${i+1}. ${getName(x[0])} — ${x[1].rolls}`
      )
      .join("\n");

  const topLevels =
    [...entries]
      .sort(
        (a,b) =>
          b[1].level - a[1].level
      )
      .slice(0,5)
      .map(
        (x,i) =>
          `${i+1}. ${getName(x[0])} — ${x[1].level}`
      )
      .join("\n");

  const topRarest =
    [...entries]
      .map(x => {

        const rare =
          x[1].rarest || "None";

        return {
          id: x[0],
          rare,
          count:
            x[1].owned[rare] || 0
        };
      })
      .sort(
        (a,b) =>
          b.count - a.count
      )
      .slice(0,5)
      .map(
        (x,i) =>
          `${i+1}. ${getName(x.id)} — ${x.rare} (${x.count}x)`
      )
      .join("\n");

  const embed = createEmbed(
    "📊 Leaderboards"
  );

  embed.addFields(
    {
      name: "💎 Rarest Rolls",
      value: topRarest || "None"
    },
    {
      name: "🔁 Rolls",
      value: topRolls || "None"
    },
    {
      name: "⭐ Levels",
      value: topLevels || "None"
    }
  );

  return message.reply({
    embeds: [embed]
  });
}

// ================= BOT =================
client.on(
  "messageCreate",
  async message => {

    if (
      message.author.bot ||
      !message.guild
    ) return;

    if (
      message.channel.id !== CHANNEL_ID
    ) return;

    const user =
      getUser(
        message.author.id
      );

    if (
      message.content === "?roll"
    ) {
      return handleRoll(
        message,
        user
      );
    }

    if (
      message.content === "?inv"
    ) {
      return handleInventory(
        message,
        user
      );
    }

    if (
      message.content.startsWith("?use")
    ) {
      return handleUse(
        message,
        user
      );
    }

    if (
      message.content === "?leaderboard"
    ) {
      return handleLeaderboard(
        message
      );
    }
  }
);

client.login(
  process.env.TOKEN
);
