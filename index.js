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
  "Part I": 1,"Part II": 2,"Part III": 3,
  "Reset I": 5,"Reset II": 7,"Reset III": 10,
  "Gold Part I": 15,"Gold Part II": 20,"Gold Part III": 25,
  "Rainbow Part I": 50,"Rainbow Part II": 65,"Rainbow Part III": 80,
  "Dark Part I": 100,"Dark Part II": 150,"Dark Part III": 200,
  "Tier I": 300,"Tier II": 400,"Tier III": 500,
  "Automation I": 650,"Automation II": 800,"Automation III": 1000,
  "Deep Research I": 1500,"Deep Research II": 2500,"Deep Research III": 3500,
  "Everything I": 5000,"Everything II": 7500,"Everything III": 10000
};

// ================= DICE SYSTEM =================
function giveDice(user) {
  const r = Math.random();

  if (r < 0.0001) return user.inventory["Cosmic Lucky Dice"]++, "🌌 Cosmic Dice";
  if (r < 0.001) return user.inventory["Diamond Lucky Dice"]++, "💎 Diamond Dice";
  if (r < 0.01) return user.inventory["Golden Lucky Dice"]++, "🥇 Golden Dice";
  if (r < 0.05) return user.inventory["Lucky Dice"]++, "🎲 Lucky Dice";

  return null;
}

// ================= ROLL =================
function roll(luck) {
  const c = (p, n, d) =>
    Math.random() < p * luck ? { name: n, display: d } : null;

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
    c(3e-4, "Dark Part III", "1/30K") ||
    c(1.5e-4, "Dark Part II", "1/15K") ||
    c(7e-4, "Dark Part I", "1/7K") ||
    c(4e-4, "Rainbow Part III", "1/4K") ||
    c(2e-4, "Rainbow Part II", "1/2K") ||
    c(1e-3, "Rainbow Part I", "1/1K") ||
    c(6e-4, "Gold Part III", "1/600") ||
    c(3e-4, "Gold Part II", "1/300") ||
    c(1.5e-4, "Gold Part I", "1/150") ||
    c(7e-5, "Reset III", "1/75") ||
    c(4e-5, "Reset II", "1/40") ||
    c(2e-5, "Reset I", "1/20") ||
    c(1e-5, "Part III", "1/10") ||
    c(1e-6, "Part II", "1/6") ||
    { name: "Part I", display: "1/3" }
  );
}

// ================= EFFECT =================
function effect(n){
  const v = points[n]||0;
  if(v>=7500) return {color:0xFF00FF,title:"🌌 MYTHIC DROP"};
  if(v>=2500) return {color:0xFF4500,title:"🔥 LEGENDARY DROP"};
  if(v>=1000) return {color:0x00FFFF,title:"⚡ EPIC DROP"};
  if(v>=500) return {color:0xFFD700,title:"✨ RARE DROP"};
  if(v>=100) return {color:0x00FF00,title:"💠 UNCOMMON DROP"};
  return {color:COLOR,title:"🎲 Roll Result"};
}

// ================= AUTOROLL =================
function getInterval(u){
  let base = 10;
  if(u.rebirths >= 3){
    base -= Math.min(u.rebirths - 2, 5);
  }
  return Math.max(base, 5) * 1000;
}

function startAutoroll(id){
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
  }, getInterval(getUser(id)));
}

    u.rolls++;
    u.xp += points[r.name]||1;
    u.owned[r.name]=(u.owned[r.name]||0)+1;

    if(!autorollLogs[id]) autorollLogs[id]=[];
    autorollLogs[id].push(r);

    saveData();
  }, getInterval(getUser(id)));
}

// ================= BOT =================
client.on("messageCreate", async (msg) => {
  if(!msg.guild || msg.author.bot) return;

  const u = getUser(msg.author.id);
  const isAdmin = msg.member?.permissions?.has(PermissionFlagsBits.Administrator);

  lastSeen[msg.author.id] = Date.now();

  // AUTOROLL SUMMARY
const now = Date.now();
const last = lastSeen[msg.author.id] || now;

// only show if inactive for 30+ seconds
if (autorollLogs[msg.author.id]?.length && now - last > 30000) {

  const log = autorollLogs[msg.author.id];
  autorollLogs[msg.author.id] = [];

  msg.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("⏳ Autoroll Summary")
        .setDescription(
          log.slice(-20).map(x => `🎲 ${x.name} (${x.display})`).join("\n")
        )
    ]
  });
}
  // ================= ROLL =================
if (msg.content === "?roll") {

  const u = getUser(msg.author.id);

  // unlock condition
  if (u.rebirths < 1) {
    return msg.reply("🔒 Autoroll unlocks at Rebirth 1");
  }

  startAutoroll(msg.author.id);

    const boost = activeBoost[msg.author.id] || 1;
    delete activeBoost[msg.author.id];

    const luck = getLuck(u.level,u.rebirths) * boost;

    let anim = await msg.reply("🎲 Rolling...");
    const r = roll(luck);

    u.rolls++;
    const gain = points[r.name]||1;
    u.xp += gain;

    u.owned[r.name]=(u.owned[r.name]||0)+1;

    if(!u.rarest || (points[r.name]||0)>(points[u.rarest]||0))
      u.rarest=r.name;

    let leveled=false;
    while(u.xp>=xpNeeded(u.level)){
      u.xp-=xpNeeded(u.level);
      u.level++;
      leveled=true;
    }

    const dice = giveDice(u);
    saveData();

    const e = effect(r.name);

    const embed = new EmbedBuilder()
      .setColor(e.color)
      .setTitle("🎲 Roll Result🎲")
      .addFields(
        {name:"✨Result✨",value:`${r.name} [${r.display}]`},
        {name:"📈Progress📈",value:`⭐Level: ${u.level}\nXP: ${u.xp}/${xpNeeded(u.level)} [+${gain}]`},
        {name:"⚡Roll Stats⚡",value:`🔁Rolls: ${u.rolls}\n🍀Luck: x${luck.toFixed(2)}`}
      )
      .setFooter({text:`RNG System Luck Engine Active • ${new Date().toLocaleTimeString()}`});

    if(dice) embed.addFields({name:"🎁 Dice",value:dice});
    if(leveled) embed.addFields({name:"⬆️ Level Up!",value:"LEVEL UP!"});

    await anim.edit({embeds:[embed]});

    const role = roleRewards[r.name];
    if(role) msg.member.roles.add(role).catch(()=>{});

    return;
  }
// ================= PROFILE =================
if (msg.content.startsWith("?profile")) {
  const target = msg.mentions.users.first() || msg.author;
  const p = getUser(target.id);

  // calculate rarest count safely
  let rareCount = 0;
  if (p.rarest && p.owned?.[p.rarest]) {
    rareCount = p.owned[p.rarest];
  }

  return msg.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(`📊 Profile - ${target.username}`)
        .addFields(
          {
            name: "⭐ Level",
            value: `**${p.level}**`,
            inline: true
          },
          {
            name: "🎲 Total Rolls",
            value: `**${p.rolls}**`,
            inline: true
          },
          {
            name: "🔄 Rebirths",
            value: `**${p.rebirths}**`,
            inline: true
          },
          {
            name: "💎 Rarest Roll",
            value: `**${p.rarest || "None"}**\n🎯 Count: **${rareCount}**`,
            inline: false
          },
          {
            name: "📈 XP Progress",
            value: `**${p.xp}/${xpNeeded(p.level)} XP**`,
            inline: false
          }
        )
        .setFooter({ text: "RNG System • Profile Data" })
        .setTimestamp()
    ]
  });
}
  // ================= INVENTORY =================
  if(msg.content === "?inv"){
    const i = u.inventory;
    return msg.reply({
      embeds:[new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("🎒 Inventory")
        .setDescription(
          `🎲 Lucky: ${i["Lucky Dice"]}\n🥇 Gold: ${i["Golden Lucky Dice"]}\n💎 Diamond: ${i["Diamond Lucky Dice"]}\n🌌 Cosmic: ${i["Cosmic Lucky Dice"]}`
        )
      ]
    });
  }

  // ================= USE =================
  if(msg.content.startsWith("?use")){
    const type = msg.content.slice(4).trim().toLowerCase();

    const boosts = {
      "lucky dice":5,
      "golden lucky dice":25,
      "diamond lucky dice":100,
      "cosmic lucky dice":1000
    };

    const key = Object.keys(boosts).find(k=>k===type);
    if(!key) return msg.reply("❌ Invalid item");
    if(u.inventory[key] <= 0) return msg.reply("❌ None left");

    u.inventory[key]--;
    activeBoost[msg.author.id]=boosts[key];

    saveData();
    return msg.reply(`⚡ Used ${key}`);
  }

  // ================= REBIRTH =================
  if(msg.content === "?rebirth"){
    const req = Math.floor(1000 * Math.pow(2.5,u.rebirths));
    if(u.rolls < req) return msg.reply(`Need ${req} rolls`);

    pendingRebirth[msg.author.id]=true;

    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle("🔄 Rebirth System")
      .setDescription(
`Rebirth 1: Unlock AutoRoll (10s)
Rebirth 2: XP x1.5 per rebirth
Rebirth 3+: AutoRoll speed -1s per rebirth (min 5s max reduction 5s)`
      );

    return msg.reply({embeds:[embed]});
  }

  if(msg.content === "?rebirth confirm"){
    if(!pendingRebirth[msg.author.id]) return;

    u.rebirths++;
    u.level=1;
    u.xp=0;
    u.rolls=0;

    pendingRebirth[msg.author.id]=false;
    saveData();

    return msg.reply("✅ Rebirth complete");
  }

  // ================= ADMIN =================
  if(isAdmin){
    if(msg.content.startsWith("?setrolls")){
      const user = msg.mentions.users.first();
      const amt = parseInt(msg.content.split(" ")[2]);
      getUser(user.id).rolls = amt;
      saveData();
      return msg.reply("done");
    }

    if(msg.content.startsWith("?setlevel")){
      const user = msg.mentions.users.first();
      const amt = parseInt(msg.content.split(" ")[2]);
      getUser(user.id).level = amt;
      saveData();
      return msg.reply("done");
    }

    if(msg.content.startsWith("?setrebirth")){
      const user = msg.mentions.users.first();
      const amt = parseInt(msg.content.split(" ")[2]);
      getUser(user.id).rebirths = amt;
      saveData();
      return msg.reply("done");
    }
  }

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

    const topLevel = [...entries]
      .sort((a, b) => b[1].level - a[1].level)
      .slice(0, 5)
      .map((x, i) =>
        `${i + 1}. ⭐ ${getName(x[0])} — Level ${x[1].level}`
      )
      .join("\n");

    const topRebirths = [...entries]
      .sort((a, b) => b[1].rebirths - a[1].rebirths)
      .slice(0, 5)
      .map((x, i) =>
        `${i + 1}. 🔄 ${getName(x[0])} — ${x[1].rebirths}`
      )
      .join("\n");

    const topRarest = [...entries]
      .sort((a, b) => getRarestCount(b[1]) - getRarestCount(a[1]))
      .slice(0, 5)
      .map((x, i) => {
        const u = x[1];
        const rare = u.rarest || "None";
        const count = getRarestCount(u);
        return `${i + 1}. 💎 ${getName(x[0])} — ${rare} (${count})`;
      })
      .join("\n");

return msg.reply({
  embeds: [
    new EmbedBuilder()
      .setColor(COLOR)
      .setTitle("📊 Leaderboards")
      .addFields(
        { name: "🎲 Total Rolls", value: topRolls || "None" },
        { name: "⭐ Levels", value: topLevel || "None" },
        { name: "🔄 Rebirths", value: topRebirths || "None" },
        { name: "💎 Rarest Rolls", value: topRarest || "None" }
      )
      .setFooter({ text: "RNG Leaderboard System" })
  ]
});


}); // ⬅️ THIS CLOSES messageCreate EVENT (YOU WERE MISSING THIS)

client.login(process.env.TOKEN);
