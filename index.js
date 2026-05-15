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

// ---------------- DATA ----------------
let userData = {};
let pendingRebirth = {};
let activeBoost = {};
let autorollIntervals = {};

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
const xpNeeded = (l) => Math.floor(5 * Math.pow(1.5, l - 1));
const getLuck = (l, r) => Math.pow(1.2, l - 1) * Math.pow(2, r);

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
  const c = (ch, n, d) => Math.random() < ch * luck ? { name: n, display: d } : null;
  return (
    c(1/1e8,"Everything III","1/100M") ||
    c(1/1e7,"Everything II","1/10M") ||
    c(1/5e6,"Everything I","1/5M") ||
    c(1/2e6,"Deep Research III","1/2M") ||
    c(1/1e6,"Deep Research II","1/1M") ||
    c(1/7.5e5,"Deep Research I","1/750K") ||
    c(1/5e5,"Automation III","1/500K") ||
    c(1/2.5e5,"Automation II","1/250K") ||
    c(1/1.5e5,"Automation I","1/150K") ||
    c(1/1e5,"Tier III","1/100K") ||
    c(1/75000,"Tier II","1/75K") ||
    c(1/50000,"Tier I","1/50K") ||
    c(1/30000,"Dark Part III","1/30K") ||
    c(1/15000,"Dark Part II","1/15K") ||
    c(1/7000,"Dark Part I","1/7K") ||
    c(1/4000,"Rainbow Part III","1/4K") ||
    c(1/2000,"Rainbow Part II","1/2K") ||
    c(1/1000,"Rainbow Part I","1/1K") ||
    c(1/600,"Gold Part III","1/600") ||
    c(1/300,"Gold Part II","1/300") ||
    c(1/150,"Gold Part I","1/150") ||
    c(1/75,"Reset III","1/75") ||
    c(1/40,"Reset II","1/40") ||
    c(1/20,"Reset I","1/20") ||
    c(1/10,"Part III","1/10") ||
    c(1/6,"Part II","1/6") ||
    { name:"Part I", display:"1/3" }
  );
}

function rarityColor(v){
  if(v>=7500) return 0xFF00FF;
  if(v>=2500) return 0xFF4500;
  if(v>=1000) return 0x00FFFF;
  if(v>=500) return 0xFFD700;
  if(v>=100) return 0x00FF00;
  return COLOR;
}

// ---------------- AUTOROLL ----------------
function startAutoroll(user, member){
  if(autorollIntervals[user.id]) clearInterval(autorollIntervals[user.id]);

  const base = 10000;
  const reduction = Math.min(5, user.rebirths >= 3 ? user.rebirths - 2 : 0);
  const interval = Math.max(5000, base - reduction * 1000);

  autorollIntervals[user.id] = setInterval(async () => {
    const u = getUser(user.id);
    const luck = getLuck(u.level, u.rebirths);
    const r = roll(luck);

    u.rolls++;
    u.xp += points[r.name] || 1;
    u.owned[r.name] = (u.owned[r.name] || 0) + 1;

    if(!u.rarest || points[r.name] > (points[u.rarest]||0)) u.rarest = r.name;

    while(u.xp >= xpNeeded(u.level)){
      u.xp -= xpNeeded(u.level);
      u.level++;
    }

    if(points[r.name] >= 1000){
      member.send(`⚡ AutoRoll Rare Hit: ${r.name}`).catch(()=>{});
    }

    saveData();
  }, interval);
}

// ---------------- BOT ----------------
client.on("messageCreate", async msg => {
  if(!msg.guild || msg.author.bot) return;

  const isAdmin = msg.member?.permissions?.has(PermissionFlagsBits.Administrator);
  if(msg.channel.id !== CHANNEL_ID && !isAdmin) return;

  const u = getUser(msg.author.id);

  // ================= ROLL =================
  if(msg.content === "?roll"){
    const boost = activeBoost[msg.author.id]||1;
    delete activeBoost[msg.author.id];

    const luck = getLuck(u.level,u.rebirths)*boost;

    let anim = await msg.reply("🎲 Rolling...");
    const frames=["🎲","🎲.","🎲..","🎲..."];
    for(const f of frames){await new Promise(r=>setTimeout(r,300));await anim.edit(f);}

    const r = roll(luck);

    u.rolls++;
    u.xp += points[r.name]||1;
    u.owned[r.name]=(u.owned[r.name]||0)+1;

    if(!u.rarest||points[r.name]>points[u.rarest])u.rarest=r.name;

    let leveled=false;
    while(u.xp>=xpNeeded(u.level)){
      u.xp-=xpNeeded(u.level);u.level++;leveled=true;
    }

    const diceChance=Math.random();
    if(diceChance<0.0001) u.inventory["Cosmic Lucky Dice"]++;
    else if(diceChance<0.001) u.inventory["Diamond Lucky Dice"]++;
    else if(diceChance<0.01) u.inventory["Golden Lucky Dice"]++;
    else if(diceChance<0.05) u.inventory["Lucky Dice"]++;

    saveData();

    const embed=new EmbedBuilder()
      .setColor(rarityColor(points[r.name]))
      .setTitle("🎲 Roll Result🎲")
      .addFields(
        {name:"✨Result✨",value:`**${r.name}** ${r.display}`},
        {name:"📈Progress📈",value:`⭐Level: ${u.level}\nXP: ${u.xp}/${xpNeeded(u.level)} [+${points[r.name]||1}]`},
        {name:"⚡Roll Stats⚡",value:`🔁Rolls: ${u.rolls}\n🍀Luck: x${getLuck(u.level,u.rebirths).toFixed(2)}`}
      )
      .setFooter({text:"RNG System Luck Engine Active"});

    await anim.edit({content:"",embeds:[embed]});
    return;
  }

  // ================= REBIRTH =================
  if(msg.content==="?rebirth"){
    const req=Math.floor(1000*Math.pow(2.5,u.rebirths));

    const embed=new EmbedBuilder()
      .setColor(COLOR)
      .setTitle("🔄 Rebirth System")
      .setDescription(`Requirement: ${req} rolls`)
      .addFields(
        {name:"Milestones",value:
        "Rebirth 1: Autoroll unlock\nRebirth 2: 1.5x XP scaling\nRebirth 3: Faster autoroll (-1s per rebirth until 5)"}
      );

    if(u.rolls<req) return msg.reply({embeds:[embed]});

    pendingRebirth[msg.author.id]=true;
    return msg.reply({embeds:[embed, new EmbedBuilder().setColor(COLOR).setDescription("Type ?rebirth confirm")]});
  }

  if(msg.content==="?rebirth confirm" && pendingRebirth[msg.author.id]){
    const u=getUser(msg.author.id);
    u.rebirths++;
    u.level=1;
    u.xp=0;
    u.rolls=0;

    startAutoroll(u,msg.member);

    pendingRebirth[msg.author.id]=false;
    saveData();
    return msg.reply("Rebirth complete");
  }

  // ================= INVENTORY =================
  if(msg.content==="?inv"){
    return msg.reply({embeds:[new EmbedBuilder()
      .setColor(COLOR)
      .setTitle("🎒 Inventory")
      .setDescription(
        `🎲 Lucky Dice: ${u.inventory["Lucky Dice"]}\n`+
        `🥇 Golden Dice: ${u.inventory["Golden Lucky Dice"]}\n`+
        `💎 Diamond Dice: ${u.inventory["Diamond Lucky Dice"]}\n`+
        `🌌 Cosmic Dice: ${u.inventory["Cosmic Lucky Dice"]}`
      )]});
  }

  // ================= ADMIN =================
  if(isAdmin && msg.content.startsWith("?")){
    const args=msg.content.split(" ");
    const cmd=args[0];

    if(cmd==="?setrolls"){getUser(msg.mentions.users.first().id).rolls=parseInt(args[2]);return msg.reply("OK");}
    if(cmd==="?setlevel"){getUser(msg.mentions.users.first().id).level=parseInt(args[2]);return msg.reply("OK");}
    if(cmd==="?setrebirth"){getUser(msg.mentions.users.first().id).rebirths=parseInt(args[2]);return msg.reply("OK");}
  }

});

client.login(process.env.TOKEN);
