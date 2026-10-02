const { cmd } = require("../command");

cmd({
  pattern: "invite",
  alias: ["aja", "glink", "invitelink"],
  desc: "Send group invite link to user or view link",
  category: "group",
  filename: __filename,
  react: "📨"
}, async (conn, mek, m, { 
  from, args, isGroup, isBotAdmins, isCreator, isOwner, isAdmins, reply 
}) => {
  try {
    if (!isGroup) return await reply("⚠️ This command can only be used in groups.");
    if (!isBotAdmins) return await reply("❌ I need to be an admin to generate group link.");
    if (!isCreator && !isOwner && !isAdmins) return await reply("🔐 Only group admins or owners can use this command.");

    const code = await conn.groupInviteCode(from);
    const link = `https://chat.whatsapp.com/${code}`;
    const metadata = await conn.groupMetadata(from);

    if (!args[0]) {
      let card = 
`*╭─═━━━ 🔗 GROUP INVITE ━━━═─╮*
│
*│ 👥 Group:* ${metadata.subject}
*│ 👑 Owner:* @${metadata.owner ? metadata.owner.split('@')[0] : 'N/A'}
*│ 👥 Members:* ${metadata.participants.length}
│
*│ 🔗 Link:*
*│* ${link}
│
*╰─═━━━━━━━━━━━━━━━━━━━━═─╯*

> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ ⚡*`;

      return await conn.sendMessage(from, { text: card, mentions: [metadata.owner].filter(Boolean) }, { quoted: mek });
    }

    let number = args[0].replace(/[^0-9]/g, '');
    if (number.length < 10) {
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      return await reply("⚠️ Please provide a valid phone number with country code.");
    }
    
    let jid = number + "@s.whatsapp.net";

    let inviteMsg = 
`*╭─═━━━ 📨 GROUP INVITATION ━━━═─╮*
│
*│ You have been invited to join:*
*│ 📌 Group:* ${metadata.subject}
*│ 👤 Invited By:* @${m.sender.split('@')[0]}
│
*│ 🔗 Join Here:*
*│* ${link}
│
*╰─═━━━━━━━━━━━━━━━━━━━━═─╯*

> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ ⚡*`;

    await conn.sendMessage(jid, { text: inviteMsg, mentions: [m.sender] });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Invite Command Error:", err);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    await reply(`❌ Failed to send invite: ${err.message || err}`);
  }
});
