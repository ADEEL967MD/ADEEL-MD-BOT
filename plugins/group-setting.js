const { cmd } = require("../command");

cmd({
  pattern: "kick",
  alias: ["k", "remove", "nital"],
  desc: "Remove a user from the group",
  category: "group",
  react: "💀",
  filename: __filename
}, async (conn, mek, m, {
  from,
  isOwner,
  isCreator,
  isBotAdmins,
  isAdmins,
  isGroup,
  quoted,
  reply,
  botNumber2,
  botNumber
}) => {
  try {
    if (!isGroup) return await reply("❌ This command only works in groups.");
    if (!isBotAdmins) return await reply("❌ I must be admin to remove someone.");
    if (!isAdmins && !isOwner && !isCreator) return await reply("❌ Access Denied! Only group admins or Bot Owner can use this command.");

    if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
      return await reply("❌ You did not give me a user to remove!");
    }
    let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
    if (!users) return await reply("❌ Couldn't determine target user.");

    if (users === botNumber || users === botNumber2) return await reply("❌ I can't kick myself!");
    const self = conn.user.id.split(":")[0] + '@s.whatsapp.net';
    if (users === self) return await reply("❌ That's the owner! I can't remove them.");

    await conn.groupParticipantsUpdate(from, [users], "remove");
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    await reply(`*✅ Successfully removed from group.*`, { mentions: [users] });

  } catch (err) {
    console.error(err);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    await reply("❌ Failed to remove user. Something went wrong.");
  }
});

cmd({
  pattern: "promote",
  alias: ["p", "giveadmin", "permote", "admin"],
  desc: "Promote a user to admin",
  category: "group",
  react: "💀",
  filename: __filename
}, async (conn, mek, m, {
  from,
  isOwner,
  isCreator,
  isBotAdmins,
  isAdmins,
  isGroup,
  quoted,
  reply,
  botNumber2,
  botNumber
}) => {
  try {
    if (!isGroup) return await reply("❌ This command only works in groups.");
    if (!isBotAdmins) return await reply("❌ I must be admin to promote someone.");
    if (!isAdmins && !isOwner && !isCreator) return await reply("❌ Access Denied! Only group admins or Bot Owner can use this command.");

    if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
      return await reply("❌ You did not give me a user to promote!");
    }
    let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
    if (!users) return await reply("❌ Couldn't determine target user.");

    if (users === botNumber || users === botNumber2) return await reply("❌ I can't promote myself!");
    const self = conn.user.id.split(":")[0] + '@s.whatsapp.net';
    if (users === self) return await reply("❌ Owner is already super admin!");

    await conn.groupParticipantsUpdate(from, [users], "promote");
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    await reply(`*✅ Successfully Promoted to Admin.*`, { mentions: [users] });

  } catch (err) {
    console.error(err);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    await reply("❌ Failed to promote. Something went wrong.");
  }
});

cmd({
  pattern: "demote",
  alias: ["d", "dismiss", "removeadmin"],
  desc: "Demote a group admin",
  category: "group",
  react: "💀",
  filename: __filename
}, async (conn, mek, m, {
  from,
  isOwner,
  isCreator,
  isBotAdmins,
  isAdmins,
  isGroup,
  quoted,
  reply,
  botNumber2,
  botNumber
}) => {
  try {
    if (!isGroup) return await reply("❌ This command only works in groups.");
    if (!isBotAdmins) return await reply("❌ I must be admin to demote someone.");
    if (!isAdmins && !isOwner && !isCreator) return await reply("❌ Access Denied! Only group admins or Bot Owner can use this command.");

    if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
      return await reply("❌ You did not give me a user to demote!");
    }
    let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
    if (!users) return await reply("❌ Couldn't determine target user.");

    if (users === botNumber || users === botNumber2) return await reply("❌ I can't demote myself!");
    const self = conn.user.id.split(":")[0] + '@s.whatsapp.net';
    if (users === self) return await reply("❌ I can't demote the owner!");

    await conn.groupParticipantsUpdate(from, [users], "demote");
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    await reply(`*✅ Admin Successfully demoted to a normal member.*`, { mentions: [users] });

  } catch (err) {
    console.error(err);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    await reply("❌ Failed to demote. Something went wrong.");
  }
});

cmd({
  pattern: "kickall",
  alias: ["byeall", "end", "endgc", "nuke"],
  desc: "Removes all members from group except specified numbers",
  category: "group",
  react: "⚠️",
  filename: __filename
}, async (conn, mek, m, {
  from,
  isOwner,
  isCreator,
  isBotAdmins,
  botNumber2,
  botNumber,
  isGroup,
  sender,
  metadata,
  reply
}) => {
  try {
    if (!isGroup) return await reply("❌ This command only works in groups.");
    if (!isBotAdmins) return await reply("❌ I must be admin to remove members.");
    if (!isOwner && !isCreator) return await reply("❌ Access Denied! Only Bot Owner can use this command.");

    const ignoreJids = [
      botNumber2,
      botNumber,
      sender
    ];

    const groupData = metadata || await conn.groupMetadata(from);
    const participants = groupData.participants || [];

    const targets = participants.filter(p => !ignoreJids.includes(p.id));
    const jids = targets.map(p => p.id);

    if (jids.length === 0) {
      return await reply("✅ No members to remove (everyone is excluded).");
    }

    await conn.groupParticipantsUpdate(from, jids, "remove");
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    await reply(`✅ Successfully removed ${jids.length} member${jids.length > 1 ? 's' : ''} from the group.`);

  } catch (err) {
    console.error(err);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    await reply("❌ Failed to remove members. I may not have admin permission.");
  }
});
