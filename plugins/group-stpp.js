const { cmd } = require("../command");

cmd({
  pattern: "gcpp",
  alias: ["gpp", "fullppgc", "gcdp", "groupdp"],
  react: "🏙️",
  desc: "Group Admin Only - Set group profile picture",
  category: "group",
  filename: __filename
}, async (client, message, match, { from, isCreator, isBotAdmins, isAdmins, isGroup }) => {
  try {
    if (!isGroup) {
      await client.sendMessage(from, { react: { text: "❌", key: message.key } });
      return await client.sendMessage(from, {
        text: "⚠️ This command only works in groups."
      }, { quoted: message });
    }

    if (!isBotAdmins) {
      await client.sendMessage(from, { react: { text: "❌", key: message.key } });
      return await client.sendMessage(from, {
        text: "❌ I must be admin to change group picture."
      }, { quoted: message });
    }

    if (!isAdmins && !isCreator) {
      await client.sendMessage(from, { react: { text: "❌", key: message.key } });
      return await client.sendMessage(from, {
        text: "🔐 Only admins can use this command."
      }, { quoted: message });
    }

    if (!match.quoted) {
      await client.sendMessage(from, { react: { text: "❌", key: message.key } });
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to an image with .setgcpp*"
      }, { quoted: message });
    }

    const mtype = match.quoted.mtype;
    
    if (mtype !== "imageMessage") {
      await client.sendMessage(from, { react: { text: "❌", key: message.key } });
      return await client.sendMessage(from, {
        text: "❌ Only image messages are supported for group picture"
      }, { quoted: message });
    }

    const buffer = await match.quoted.download();
    
    await client.updateProfilePicture(from, buffer);
    
    await client.sendMessage(from, { react: { text: "✅", key: message.key } });
    await client.sendMessage(from, {
      text: "*✅ Group profile picture updated successfully!*"
    }, { quoted: message });

  } catch (error) {
    console.error("setgcpp Error:", error);
    await client.sendMessage(from, { react: { text: "❌", key: message.key } });
    await client.sendMessage(from, {
      text: "❌ Error updating group picture:\n" + error.message
    }, { quoted: message });
  }
});
