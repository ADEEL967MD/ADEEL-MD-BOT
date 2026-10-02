const { cmd } = require("../command");

const FOOTER = `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ ⚡*`;

const contextInfo = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: '120363403380688821@newsletter',
    newsletterName: "𝐀𝐃𝐄𝐄𝐋-𝐌𝐃",
    serverMessageId: Date.now()
  }
};

cmd({
  pattern: "vv",
  alias: ["viewonce", 'retrive'],
  react: '🐳',
  desc: "Owner Only - retrieve quoted message back to user",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isCreator }) => {
  try {
    if (!isCreator) {
      return await client.sendMessage(from, {
        text: "*📛 This is an owner command.*"
      }, { quoted: message });
    }

    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to a view once message!*"
      }, { quoted: message });
    }

    const buffer = await match.quoted.download();
    const mtype = match.quoted.mtype;

    const q = match.quoted;
    const text = (
      q.text || 
      q.caption || 
      q.body || 
      q.msg?.caption || 
      q.msg?.text || 
      q.message?.imageMessage?.caption || 
      q.message?.videoMessage?.caption || 
      ""
    ).trim();

    const caption = text ? `${text}\n\n${FOOTER}` : `${FOOTER}`;
    const options = { quoted: message };

    let messageContent = {};
    switch (mtype) {
      case "imageMessage":
        messageContent = {
          image: buffer,
          caption: caption,
          mimetype: match.quoted.mimetype || "image/jpeg",
          contextInfo
        };
        break;
      case "videoMessage":
        messageContent = {
          video: buffer,
          caption: caption,
          mimetype: match.quoted.mimetype || "video/mp4",
          contextInfo
        };
        break;
      case "audioMessage":
        messageContent = {
          audio: buffer,
          mimetype: "audio/mp4",
          ptt: match.quoted.ptt || false,
          contextInfo
        };
        break;
      default:
        return await client.sendMessage(from, {
          text: "❌ Only image, video, and audio messages are supported"
        }, { quoted: message });
    }

    await client.sendMessage(from, messageContent, options);
  } catch (error) {
    console.error("vv Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error fetching vv message:\n" + error.message
    }, { quoted: message });
  }
});
