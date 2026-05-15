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

// ---------------- DICE ----------------
function giveDice(user) {
  const r = Math.random();
  if (r < 1/10000) return user.inventory["Cosmic Lucky Dice"]++, "🌌 Cosmic Lucky Dice";
  if (r < 1/2500) return user.inventory["Diamond Lucky Dice"]++, "💎 Diamond Lucky Dice";
  if (r < 1/500) return user.inventory["Golden Lucky Dice"]++, "🥇 Golden Lucky Dice";
  if (r < 1/50) return user.inventory["Lucky Dice"]++, "🎲 Lucky Dice";
  return null;
}

// ---------------- ROLL ----------------
function roll(luck) {
  const c = (x,n,d)=>Math.random()<x*luck?{name:n,display:d}:null;

  return (
    c(1/100000000,"Everything III","1/100M") ||
    c(1/10000000,"Everything II","1/10M") ||
    c(1/5000000,"Everything I","1/5M") ||
    c(1/2000000,"Deep Research III","1/2M") ||
    c(1/1000000,"Deep Research II","1/1M") ||
    c(1/750000,"Deep Research I","1/750K") ||
    c(1/500000,"Automation III","1/500K") ||
    c(1/250000,"Automation II","1/250K") ||
    c(1/150000,"Automation I","1/150K") ||
    c(1/100000,"Tier III","1/100K") ||
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
    {name:"Part I",display:"1/3"}
  );
}

// ---------------- EFFECT ----------------
function effect(name){
  const v=points[name]||0;
  if(v>=7500)return{color:0xFF00FF,title:"🌌 MYTHIC DROP!"};
  if(v>=2500)return{color:0xFF4500,title:"🔥 LEGENDARY DROP!"};
  if(v>=1000)return{color:0x00FFFF,title:"⚡ EPIC DROP!"};
  if(v>=500)return{color:0xFFD700,title:"✨ RARE DROP!"};
  if(v>=100)return{color:0x00FF00,title:"💠 UNCOMMON DROP!"};
  return{color:COLOR,title:"🎲 Roll"};
}

// ---------------- AUTOROLL ----------------
function startAutoroll(id, member){
  if(autorollIntervals[id]) return;

  const u=getUser(id);

  let interval=10000;
  if(u.rebirths>=3){
    interval -= Math.min((u.rebirths-2)*1000,5000);
  }

  autorollIntervals[id]=setInterval(async()=>{
    const u=getUser(id);
    const r=roll(getLuck(u.level,u.rebirths));

    u.rolls++;
    u.xp+=points[r.name]||1;
    u.owned[r.name]=(u.owned[r.name]||0)+1;

    saveData();

    try{
      await member.send(`🎲 Autoroll: **${r.name}**`);
    }catch{}
  },interval);
}

// ---------------- BOT ----------------
client.on("messageCreate",async(msg)=>{
  if(!msg.guild||msg.author.bot)return;

  const isAdmin=msg.member?.permissions?.has(PermissionFlagsBits.Administrator);
  if(msg.channel.id!==CHANNEL_ID&&!isAdmin)return;

  const u=getUser(msg.author.id);

  // ================= ROLL =================
  if(msg.content==="?roll"){
    const boost=activeBoost[msg.author.id]||1;
    delete activeBoost[msg.author.id];

    const luck=getLuck(u.level,u.rebirths)*boost;

    let anim=await msg.reply("🎲 Rolling...");
    const frames=["🎲","🎲.","🎲..","🎲..."];
    for(const f of frames){
      await new Promise(r=>setTimeout(r,300));
      await anim.edit(f);
    }

    const r=roll(luck);

    u.rolls++;

    let xpGain=(points[r.name]||1);
    if(u.rebirths>=2) xpGain*=Math.pow(1.5,u.rebirths-1);

    u.xp+=xpGain;
    u.owned[r.name]=(u.owned[r.name]||0)+1;

    if(!u.rarest||(points[r.name]||0)>(points[u.rarest]||0)){
      u.rarest=r.name;
    }

    while(u.xp>=xpNeeded(u.level)){
      u.xp-=xpNeeded(u.level);
      u.level++;
    }

    const dice=giveDice(u);
    saveData();

    const e=effect(r.name);

    const embed=new EmbedBuilder()
      .setColor(e.color)
      .setTitle(`🎲 ${e.title}`)
      .addFields(
        {name:"🎯 Result",value:`**${r.name}** (${r.display})`},
        {name:"📊 Level",value:`⭐ ${u.level}\n📊 XP ${u.xp}/${xpNeeded(u.level)}`},
        {name:"⚡ Stats",value:`🔁 Rolls ${u.rolls}\n🍀 Luck x${luck.toFixed(2)}\n🔄 Rebirths ${u.rebirths}`}
      );

    if(dice) embed.addFields({name:"🎁 Dice",value:dice});

    await anim.edit({content:"",embeds:[embed]});

    if(roleRewards[r.name]){
      try{await msg.member.roles.add(roleRewards[r.name]);}catch{}
    }

    return;
  }

  // ================= INVENTORY =================
  if(msg.content==="?inv"){
    const i=u.inventory;
    return msg.reply({
      embeds:[new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("🎒 Inventory")
        .setDescription(
          `🎲 Lucky Dice: ${i["Lucky Dice"]}\n`+
          `🥇 Golden: ${i["Golden Lucky Dice"]}\n`+
          `💎 Diamond: ${i["Diamond Lucky Dice"]}\n`+
          `🌌 Cosmic: ${i["Cosmic Lucky Dice"]}`
        )
      ]
    });
  }

  // ================= USE =================
  if(msg.content.startsWith("?use")){
    const input=msg.content.slice(4).trim().toLowerCase();

    const boosts={
      "lucky dice":5,
      "golden lucky dice":25,
      "diamond lucky dice":100,
      "cosmic lucky dice":1000
    };

    const key=Object.keys(boosts).find(k=>k===input);
    if(!key)return msg.reply("❌ Invalid");
    if(u.inventory[key]<=0)return msg.reply("❌ None");

    u.inventory[key]--;
    activeBoost[msg.author.id]=boosts[key];

    saveData();
    return msg.reply(`⚡ Used ${key}`);
  }

  // ================= REBIRTH =================
  if(msg.content==="?rebirth"){
    const embed=new EmbedBuilder()
      .setColor(COLOR)
      .setTitle("🔄 Rebirth System")
      .setDescription("Type ?rebirth confirm")
      .addFields({
        name:"📜 Milestones",
        value:
        "🔓 R1: Autoroll unlock\n📈 R2: XP x1.5 scaling\n⚡ R3+: Autoroll faster (-1s per rebirth, max 5)"
      });

    pendingRebirth[msg.author.id]=true;
    return msg.reply({embeds:[embed]});
  }

  if(msg.content==="?rebirth confirm"){
    if(!pendingRebirth[msg.author.id])return;

    u.rebirths++;
    u.level=1;
    u.xp=0;
    u.rolls=0;

    if(u.rebirths===1) startAutoroll(msg.author.id,msg.member);

    pendingRebirth[msg.author.id]=false;
    saveData();
    return msg.reply("🔄 Rebirth complete");
  }

  // ================= ADMIN =================
  if(msg.content.startsWith("?setrolls")&&isAdmin){
    getUser(msg.mentions.users.first().id).rolls=parseInt(msg.content.split(" ")[2]);
    saveData();
    return msg.reply("Done");
  }

  if(msg.content.startsWith("?setlevel")&&isAdmin){
    getUser(msg.mentions.users.first().id).level=parseInt(msg.content.split(" ")[2]);
    saveData();
    return msg.reply("Done");
  }

  if(msg.content.startsWith("?setrebirth")&&isAdmin){
    getUser(msg.mentions.users.first().id).rebirths=parseInt(msg.content.split(" ")[2]);
    saveData();
    return msg.reply("Done");
  }

  // ================= LEADERBOARD =================
  if(msg.content==="?leaderboard"){
    const entries=Object.entries(userData);

    const name=id=>msg.guild.members.cache.get(id)?.displayName||"Unknown";

    return msg.reply({
      embeds:[new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("📊 Leaderboard")
        .addFields(
          {name:"🔁 Rolls",value:entries.sort((a,b)=>b[1].rolls-a[1].rolls).slice(0,5).map((x,i)=>`🏆 ${i+1}. **${name(x[0])}** — 🔁 ${x[1].rolls}`).join("\n")},
          {name:"⭐ Levels",value:entries.sort((a,b)=>b[1].level-a[1].level).slice(0,5).map((x,i)=>`⭐ ${i+1}. **${name(x[0])}** — ⭐ ${x[1].level}`).join("\n")},
          {name:"🔄 Rebirths",value:entries.sort((a,b)=>b[1].rebirths-a[1].rebirths).slice(0,5).map((x,i)=>`🔄 ${i+1}. **${name(x[0])}** — 🔄 ${x[1].rebirths}`).join("\n")}
        )
      ]
    });
  }
});

client.login(process.env.TOKEN);
