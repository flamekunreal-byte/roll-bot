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
let autorollLogs = {};
let autorollIntervals = {};
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

// ================= SAVE / LOAD =================
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

// ================= STATS =================
function xpNeeded(level) {
  return Math.floor(5 * Math.pow(1.5, level - 1));
}

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

// ================= DICE =================
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
  const c = (p,n,d)=>Math.random()<p*luck?{name:n,display:d}:null;

  return (
    c(1e-8,"Everything III","1/100M")||
    c(1e-7,"Everything II","1/10M")||
    c(5e-7,"Everything I","1/5M")||
    c(2e-6,"Deep Research III","1/2M")||
    c(1e-6,"Deep Research II","1/1M")||
    c(7.5e-6,"Deep Research I","1/750K")||
    c(5e-6,"Automation III","1/500K")||
    c(2.5e-5,"Automation II","1/250K")||
    c(1.5e-5,"Automation I","1/150K")||
    c(1e-4,"Tier III","1/100K")||
    c(7.5e-4,"Tier II","1/75K")||
    c(5e-4,"Tier I","1/50K")||
    c(3e-4,"Dark Part III","1/30K")||
    c(1.5e-4,"Dark Part II","1/15K")||
    c(7e-4,"Dark Part I","1/7K")||
    c(4e-4,"Rainbow Part III","1/4K")||
    c(2e-4,"Rainbow Part II","1/2K")||
    c(1e-3,"Rainbow Part I","1/1K")||
    c(6e-4,"Gold Part III","1/600")||
    c(3e-4,"Gold Part II","1/300")||
    c(1.5e-4,"Gold Part I","1/150")||
    c(7e-5,"Reset III","1/75")||
    c(4e-5,"Reset II","1/40")||
    c(2e-5,"Reset I","1/20")||
    c(1e-5,"Part III","1/10")||
    c(1e-6,"Part II","1/6")||
    {name:"Part I",display:"1/3"}
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

// ================= AUTOROLL SPEED =================
function getInterval(u){
  let base = 10;
  if(u.rebirths >= 3){
    base -= Math.min(u.rebirths - 2, 5);
  }
  return Math.max(base, 5) * 1000;
}

// ================= AUTOROLL =================
function startAutoroll(id){
  if(autorollIntervals[id]) return;

  autorollIntervals[id] = setInterval(() => {
    const u = getUser(id);
    const luck = getLuck(u.level,u.rebirths);
    const r = roll(luck);

    u.rolls++;
    u.xp += points[r.name]||1;
    u.owned[r.name]=(u.owned[r.name]||0)+1;

    if(!autorollLogs[id]) autorollLogs[id]=[];
    autorollLogs[id].push(r);

    saveData();
  }, getInterval(getUser(id)));
}

// ================= BOT =================
client.on("messageCreate", async msg => {
  if(!msg.guild || msg.author.bot) return;

  const u = getUser(msg.author.id);
  const isAdmin = msg.member?.permissions?.has(PermissionFlagsBits.Administrator);

  lastSeen[msg.author.id] = Date.now();

  // AUTOROLL SUMMARY
  if(autorollLogs[msg.author.id]?.length){
    const log = autorollLogs[msg.author.id];
    autorollLogs[msg.author.id]=[];

    msg.channel.send({
      embeds:[new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("⏳ Autoroll Summary")
        .setDescription(log.map(x=>"🎲 "+x.name).join("\n"))
      ]
    });
  }

  // ================= ROLL =================
  if(msg.content==="?roll"){
    startAutoroll(msg.author.id);

    const luck = getLuck(u.level,u.rebirths) * (activeBoost[msg.author.id]||1);
    delete activeBoost[msg.author.id];

    let anim = await msg.reply("🎲 Rolling...");
    const r = roll(luck);

    u.rolls++;
    u.xp += points[r.name]||1;
    u.owned[r.name]=(u.owned[r.name]||0)+1;

    if(!u.rarest || (points[r.name]||0)>(points[u.rarest]||0)) u.rarest=r.name;

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
        {name:"📈Progress📈",value:`⭐Level: ${u.level}\nXP: ${u.xp}/${xpNeeded(u.level)} [+${points[r.name]||1}]`},
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
  if(msg.content.startsWith("?profile")){
    const user = msg.mentions.users.first()||msg.author;
    const p = getUser(user.id);

    return msg.reply({
      embeds:[new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(`📊 Profile - ${user.username}`)
        .addFields(
          {name:"⭐ Level",value:`${p.level}`,inline:true},
          {name:"🔁 Rolls",value:`${p.rolls}`,inline:true},
          {name:"🔄 Rebirths",value:`${p.rebirths}`,inline:true},
          {name:"💎 Rarest",value:`${p.rarest||"None"}`}
        )
      ]
    });
  }

  // ================= INVENTORY =================
  if(msg.content==="?inv"){
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

// ================= ADMIN COMMANDS =================
if (isAdmin) {

  // SET ROLLS
  if (msg.content.startsWith("?setrolls")) {
    const user = msg.mentions.users.first();
    const amount = parseInt(msg.content.split(" ")[2]);

    if (!user || isNaN(amount)) return msg.reply("❌ Usage: ?setrolls @user amount");

    getUser(user.id).rolls = amount;
    saveData();
    return msg.reply("✅ Rolls updated");
  }

  // SET LEVEL
  if (msg.content.startsWith("?setlevel")) {
    const user = msg.mentions.users.first();
    const amount = parseInt(msg.content.split(" ")[2]);

    if (!user || isNaN(amount)) return msg.reply("❌ Usage: ?setlevel @user amount");

    getUser(user.id).level = amount;
    saveData();
    return msg.reply("✅ Level updated");
  }

  // SET REBIRTH
  if (msg.content.startsWith("?setrebirth")) {
    const user = msg.mentions.users.first();
    const amount = parseInt(msg.content.split(" ")[2]);

    if (!user || isNaN(amount)) return msg.reply("❌ Usage: ?setrebirth @user amount");

    getUser(user.id).rebirths = amount;
    saveData();
    return msg.reply("✅ Rebirth updated");
  }

  // ADD/REMOVE ROLLS
  if (msg.content.startsWith("?rolls")) {
    const [, action, amount] = msg.content.split(" ");
    const val = parseInt(amount);

    if (isNaN(val)) return msg.reply("❌ Invalid amount");

    if (action === "add") u.rolls += val;
    if (action === "remove") u.rolls = Math.max(0, u.rolls - val);

    saveData();
    return msg.reply("✅ Rolls modified");
  }

  // GIVE DICE
  if (msg.content.startsWith("?give dice")) {
    const args = msg.content.split(" ");
    const user = msg.mentions.users.first();
    const amount = parseInt(args[args.length - 1]);
    const type = args.slice(3, args.length - 1).join(" ").toLowerCase();

    if (!user || isNaN(amount)) return msg.reply("❌ Usage: ?give dice @user type amount");

    const inv = getUser(user.id).inventory;
    const key = Object.keys(inv).find(k => k.toLowerCase() === type);

    if (!key) return msg.reply("❌ Invalid dice type");

    inv[key] += amount;
    saveData();
    return msg.reply(`✅ Gave ${amount} ${key}`);
  }

  // REMOVE DICE
  if (msg.content.startsWith("?remove dice")) {
    const args = msg.content.split(" ");
    const user = msg.mentions.users.first();
    const amount = parseInt(args[args.length - 1]);
    const type = args.slice(3, args.length - 1).join(" ").toLowerCase();

    if (!user || isNaN(amount)) return msg.reply("❌ Usage: ?remove dice @user type amount");

    const inv = getUser(user.id).inventory;
    const key = Object.keys(inv).find(k => k.toLowerCase() === type);

    if (!key) return msg.reply("❌ Invalid dice type");

    inv[key] = Math.max(0, inv[key] - amount);
    saveData();
    return msg.reply(`✅ Removed ${amount} ${key}`);
  }
}
  
  // ================= LEADERBOARD =================
  if(msg.content==="?leaderboard"){
    const top = Object.entries(userData)
      .sort((a,b)=>b[1].rolls-a[1].rolls)
      .slice(0,5)
      .map((x,i)=>`${i+1}. 🎲 ${msg.guild.members.cache.get(x[0])?.displayName||"Unknown"} - ${x[1].rolls}`)
      .join("\n");

    return msg.reply({
      embeds:[new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("📊 Leaderboard")
        .setDescription(top)
      ]
    });
  }
});

client.login(process.env.TOKEN);
