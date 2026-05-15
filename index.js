const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  allowedMentions: { parse: [] }
});

// 🔒 YOUR CHANNEL
const channelId = "1504547166088069181";

// 🎨 EMBED COLOR (#ffde10)
const EMBED_COLOR = 0xFFDE10;

// -------------------- DATA --------------------
const DATA_FILE = "./data.json";

let userData = {};
let pendingRebirth = {};
let activeBoost = {};

// -------------------- SAVE SYSTEM --------------------
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "{}");
    }

    userData = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8") || "{}"
    );
  } catch (err) {
    console.error(err);
    userData = {};
  }
}

function saveData() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(userData, null, 2)
    );
  } catch (err) {
    console.error(err);
  }
}

loadData();

setInterval(saveData, 30000);

process.on("exit", saveData);

process.on("SIGINT", () => {
  saveData();
  process.exit();
});

process.on("uncaughtException", (err) => {
  console.error(err);
  saveData();
});

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

// -------------------- DICE DROP --------------------
function giveDice(user) {
  const r = Math.random();

  // NOT affected by luck

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

// -------------------- ROLL --------------------
function roll(luck) {

  const r = Math.random();

  const check = (
    chance,
    name,
    display
  ) => {

    if (r < chance * luck) {
      return {
        name,
        display
      };
    }

    return null;
  };

  return (

    check(
      1 / 100000000,
      "Everything III",
      "1/100,000,000"
    ) ||

    check(
      1 / 10000000,
      "Everything II",
      "1/10,000,000"
    ) ||

    check(
      1 / 5000000,
      "Everything I",
      "1/5,000,000"
    ) ||

    check(
      1 / 2000000,
      "Deep Research III",
      "1/2,000,000"
    ) ||

    check(
      1 / 1000000,
      "Deep Research II",
      "1/1,000,000"
    ) ||

    check(
      1 / 750000,
      "Deep Research I",
      "1/750,000"
    ) ||

    check(
      1 / 500000,
      "Automation III",
      "1/500,000"
    ) ||

    check(
      1 / 250000,
      "Automation II",
      "1/250,000"
    ) ||

    check(
      1 / 150000,
      "Automation I",
      "1/150,000"
    ) ||

    check(
      1 / 100000,
      "Tier III",
      "1/100,000"
    ) ||

    check(
      1 / 75000,
      "Tier II",
      "1/75,000"
    ) ||

    check(
      1 / 50000,
      "Tier I",
      "1/50,000"
    ) ||

    check(
      1 / 30000,
      "Dark Part III",
      "1/30,000"
    ) ||

    check(
      1 / 15000,
      "Dark Part II",
      "1/15,000"
    ) ||

    check(
      1 / 7000,
      "Dark Part I",
      "1/7,000"
    ) ||

    check(
      1 / 4000,
      "Rainbow Part III",
      "1/4,000"
    ) ||

    check(
      1 / 2000,
      "Rainbow Part II",
      "1/2,000"
    ) ||

    check(
      1 / 1000,
      "Rainbow Part I",
      "1/1,000"
    ) ||

    check(
      1 / 600,
      "Gold Part III",
      "1/600"
    ) ||

    check(
      1 / 300,
      "Gold Part II",
      "1/300"
    ) ||

    check(
      1 / 150,
      "Gold Part I",
      "1/150"
    ) ||

    check(
      1 / 75,
      "Reset III",
      "1/75"
    ) ||

    check(
      1 / 40,
      "Reset II",
      "1/40"
    ) ||

    check(
      1 / 20,
      "Reset I",
      "1/20"
    ) ||

    check(
      1 / 10,
      "Part III",
      "1/10"
    ) ||

    check(
      1 / 6,
      "Part II",
      "1/6"
    ) ||

    {
      name: "Part I",
      display: "1/3"
    }

  );
}

// -------------------- BOT --------------------
client.on(
  "messageCreate",
  async (message) => {

    if (
      message.author.bot ||
      !message.guild
    ) return;

    if (
      message.channel.id !== channelId
    ) return;

    const user = getUser(
      message.member.id
    );

    // ---------------- ROLL ----------------
    if (
      message.content === "?roll"
    ) {

      let boost =
        activeBoost[
          message.member.id
        ] || 1;

      delete activeBoost[
        message.member.id
      ];

      const luck =
        getLuck(
          user.level,
          user.rebirths
        ) * boost;

      const result =
        roll(luck);

      user.rolls++;

      const rarity =
        result.name;

      const xpGain =
        points[rarity] || 1;

      user.xp += xpGain;

      if (
        !user.owned[rarity]
      ) {
        user.owned[rarity] = 0;
      }

      user.owned[
        rarity
      ]++;

      if (
        !user.rarest ||
        user.owned[
          rarity
        ] >
          user.owned[
            user.rarest
          ]
      ) {
        user.rarest =
          rarity;
      }

      let leveled =
        false;

      while (
        user.xp >=
        xpNeeded(
          user.level
        )
      ) {
        user.xp -=
          xpNeeded(
            user.level
          );

        user.level++;

        leveled =
          true;
      }

      const dice =
        giveDice(user);

      saveData();

      const embed =
        new EmbedBuilder()
          .setColor(
            EMBED_COLOR
          )
          .setTitle(
            "🎲 Roll Result"
          )
          .addFields(
            {
              name:
                "Rarity",
              value:
                `${rarity} [${result.display}]`
            },
            {
              name:
                "⭐ Level",
              value:
                `${user.level}`,
              inline:
                true
            },
            {
              name:
                "📊 XP",
              value:
                `${user.xp}/${xpNeeded(user.level)} (+${xpGain})`,
              inline:
                true
            },
            {
              name:
                "🔁 Rolls",
              value:
                `${user.rolls}`,
              inline:
                true
            },
            {
              name:
                "🍀 Luck",
              value:
                `x${luck.toFixed(2)}`,
              inline:
                true
            }
          );

      if (dice) {
        embed.addFields(
          {
            name:
              "🎁 Found",
            value:
              dice
          }
        );
      }

      if (leveled) {
        embed.addFields(
          {
            name:
              "⬆️ Level Up!",
            value:
              "You leveled up!"
          }
        );
      }

      return message.reply({
        embeds: [
          embed
        ]
      });
    }

    // ---------------- INVENTORY ----------------
    if (
      message.content === "?inv"
    ) {

      const inv =
        user.inventory;

      const embed =
        new EmbedBuilder()
          .setColor(
            EMBED_COLOR
          )
          .setTitle(
            "🎒 Inventory"
          )
          .addFields(
            {
              name:
                "🎲 Lucky",
              value:
                `${inv["Lucky Dice"]}`,
              inline:
                true
            },
            {
              name:
                "🥇 Golden",
              value:
                `${inv["Golden Lucky Dice"]}`,
              inline:
                true
            },
            {
              name:
                "💎 Diamond",
              value:
                `${inv["Diamond Lucky Dice"]}`,
              inline:
                true
            },
            {
              name:
                "🌌 Cosmic",
              value:
                `${inv["Cosmic Lucky Dice"]}`,
              inline:
                true
            }
          );

      return message.reply({
        embeds: [
          embed
        ]
      });
    }

    // ---------------- USE ----------------
    if (
      message.content.startsWith(
        "?use"
      )
    ) {

      const input =
        message.content
          .slice(4)
          .trim()
          .toLowerCase();

      const boosts = {
        "lucky dice": 5,
        "golden lucky dice": 25,
        "diamond lucky dice": 100,
        "cosmic lucky dice": 1000
      };

      const key =
        Object.keys(
          boosts
        ).find(
          k =>
            k ===
            input
        );

      if (!key) {
        return message.reply(
          "❌ Invalid dice."
        );
      }

      if (
        user.inventory[
          key
        ] <= 0
      ) {
        return message.reply(
          "❌ You don't have this dice."
        );
      }

      user.inventory[
        key
      ]--;

      activeBoost[
        message.member.id
      ] =
        boosts[
          key
        ];

      saveData();

      return message.reply(
        `⚡ Used ${key} → next roll x${boosts[key]} luck!`
      );
    }

    // ---------------- LEADERBOARD ----------------
    if (
      message.content === "?leaderboard"
    ) {

      const getName =
        (id) => {

          const member =
            message.guild.members.cache.get(
              id
            );

          return (
            member?.displayName ||
            "Unknown"
          );
        };

      const entries =
        Object.entries(
          userData
        );

      const topRolls =
        [...entries]
          .sort(
            (
              a,
              b
            ) =>
              (b[1]
                .rolls ||
                0) -
              (a[1]
                .rolls ||
                0)
          )
          .slice(
            0,
            5
          )
          .map(
            (
              x,
              i
            ) =>
              `${i + 1}. ${getName(x[0])} — ${x[1].rolls}`
          )
          .join(
            "\n"
          );

      const topLevels =
        [...entries]
          .sort(
            (
              a,
              b
            ) =>
              (b[1]
                .level ||
                1) -
              (a[1]
                .level ||
                1)
          )
          .slice(
            0,
            5
          )
          .map(
            (
              x,
              i
            ) =>
              `${i + 1}. ${getName(x[0])} — Level ${x[1].level}`
          )
          .join(
            "\n"
          );

      const topRarest =
        [...entries]
          .map(
            x => {

              const u =
                x[1];

              const rare =
                u.rarest ||
                "None";

              const count =
                u
                  .owned?.[
                  rare
                ] ||
                0;

              return {
                id:
                  x[0],
                rare,
                count
              };
            }
          )
          .sort(
            (
              a,
              b
            ) =>
              b.count -
              a.count
          )
          .slice(
            0,
            5
          )
          .map(
            (
              x,
              i
            ) =>
              `${i + 1}. ${getName(x.id)} — ${x.rare} (${x.count}x)`
          )
          .join(
            "\n"
          );

      const embed =
        new EmbedBuilder()
          .setColor(
            EMBED_COLOR
          )
          .setTitle(
            "📊 Leaderboards"
          )
          .addFields(
            {
              name:
                "💎 Rarest Rolls",
              value:
                topRarest ||
                "No data"
            },
            {
              name:
                "🔁 Total Rolls",
              value:
                topRolls ||
                "No data"
            },
            {
              name:
                "⭐ Levels",
              value:
                topLevels ||
                "No data"
            }
          );

      return message.reply({
        embeds: [
          embed
        ]
      });
    }
  }
);

client.login(
  process.env.TOKEN
);
