const { cmd } = require("../command");

cmd({
  pattern: "add",
  alias: ["addition", "invite"],
  react: "👥",
  desc: "Add user to group",
  category: "group",
  filename: __filename
}, async (conn, mek, m, { 
  from, 
  args, 
  quoted,
  mentionedJid,
  isGroup, 
  isBotAdmins, 
  isCreator, 
  reply 
}) => {
  try {
    if (!isGroup) return await reply("⚠️ Group only.");
    if (!isBotAdmins) return await reply("❌ I need admin.");
    if (!isCreator) return await reply("🔐 Owner only.");

    let userJid = null;

    if (!quoted && (!mentionedJid || mentionedJid.length === 0) && !args[0]) {
      return await reply("🍁 Mention a user, reply to a message, or provide a number!");
    }

    if (mentionedJid && mentionedJid.length > 0) {
      userJid = mentionedJid[0];
    } else if (quoted) {
      userJid = quoted.sender;
    } else if (args[0]) {
      const num = args[0].replace(/[^0-9]/g, '');
      if (num.length >= 10) userJid = num + "@s.whatsapp.net";
    }

    if (!userJid) return await reply("⚠️ Couldn't determine user.");

    await conn.groupParticipantsUpdate(from, [userJid], "add");

    await reply(`✅ Added @${userJid.split('@')[0]}`, { mentions: [userJid] });

  } catch (err) {
    console.error("Add Command Error:", err);
    await reply("❌ Failed to add user.");
  }
});
