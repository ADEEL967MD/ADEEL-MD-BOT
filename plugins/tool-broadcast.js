const { cmd, commands } = require('../command');
const { sleep } = require('../lib/functions');

cmd({
  pattern: "broadcast",
  category: "group",
  desc: "Bot makes a broadcast in all groups",
  filename: __filename,
  use: "<text for broadcast>"
}, async (conn, mek, m, { q, isGroup, isOwner, reply }) => {
  try {
    if (!isGroup) return reply("*❌ This command can only be used in groups!*");
    if (!isOwner) return reply("*❌ Only Bot Owner can use this command in groups!*");

    if (!q) return reply("*❌ Provide text to broadcast in all groups!*");

    let allGroups = await conn.groupFetchAllParticipating();
    let groupIds = Object.keys(allGroups);

    reply(`📢 *Sending Broadcast To ${groupIds.length} Groups...*\n⏳ *Estimated Time:* ${groupIds.length * 1.5} seconds`);

    for (let groupId of groupIds) {
      try {
        await sleep(1500);
        await conn.sendMessage(groupId, { text: q });
      } catch (err) {
        console.log(`❌ Failed to send broadcast to ${groupId}:`, err);
      }
    }

    return reply(`✅ *Successfully sent broadcast to ${groupIds.length} groups!*`);
    
  } catch (err) {
    console.error("Broadcast Error:", err);
    return reply(`⚠️ *Error:* ${err.message || err}`);
  }
});
