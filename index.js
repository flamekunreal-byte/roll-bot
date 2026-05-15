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

/* ---------------- DATA ---------------- */

let userData = {};
if (fs.existsSync(DATA_FILE)) {
  userData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
}

/* ---------------- ROLES ---------------- */

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

/* ---------------- PROBABILITY TABLE ---------------- */

const rarities = [
  ["Everything III", 1 / 100000000],
  ["Everything II", 1 / 10000000],
  ["Everything I", 1 / 5000000],

  ["Deep Research III", 1 / 2000000],
  ["Deep Research II", 1 / 1000000],
  ["Deep Research I", 1 / 750000],

  ["Automation III", 1 / 500000],
  ["Automation II", 1 / 250000],
  ["Automation I", 1 / 150000],

  ["Tier III", 1 / 100000],
  ["Tier II", 1 / 75000],
  ["Tier I", 1 / 50000],

  ["Dark Part III", 1 / 30000],
  ["Dark Part II", 1 / 15000],
  ["Dark Part I", 1 / 7000],

  ["Rainbow Part III", 1 / 4000],
  ["Rainbow Part II", 1 / 2000],
  ["Rainbow Part I", 1 / 1000],

  ["Gold Part III", 1 / 600],
  ["Gold Part II", 1 / 300],
  ["Gold Part I", 1 / 150],

  ["Reset III", 1 / 75],
  ["Reset II", 1 / 40],
  ["Reset I", 1 / 20],

  ["Part III", 1 / 10],
  ["Part II", 1 / 6],

  ["Part I", 1 / 3]
];

/* ---------------- DISPLAY CHANCES (SAFE) ---------------- */

const chanceText = Object.fromEntries(
  rarities.map(([name, weight]) => [
    name,
    `1 in ${Math.round(1 / weight).toLocaleString()}`
  ])
);

/* ---------------- ROLL ---------------- */

function roll() {
  const total = rarities.reduce((sum, r) => sum + r[1], 0);
  let r = Math.random() * total;

  for (const [name, weight] of rarities) {
    r -= weight;
    if (r <= 0) return name;
  }

  return "Part I";
}

/* ---------------- BOT ---------------- */

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;
    if (message.channel.id !== process.env.CHANNEL_ID) return;
    if (message.content !== "?roll") return;

    const result = roll();
    const member = message.member;

    if (!userData[member.id]) {
      userData[member.id] = [];
    }

    const alreadyOwned = userData[member.id].includes(result);
    const roleId = roles[result];

    if (roleId && !member.roles.cache.has(roleId)) {
      await member.roles.add(roleId);
    }

    let reply = `🎲 You got: **${result}** (${chanceText[result]})`;

    if (!alreadyOwned) {
      userData[member.id].push(result);
      saveData();

      reply += `\n🎉 You've been awarded with a new role`;
    }

    await message.reply(reply);

  } catch (err) {
    console.error("Error:", err);
  }
});

client.login(process.env.TOKEN);
