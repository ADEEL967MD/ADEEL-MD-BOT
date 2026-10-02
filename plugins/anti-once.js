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

const positiveKeywords = ["nice", "oh", "good", "cute", "🌝", "💋", "👍", "🌚", "😘", "❤", "😍", "🔥", "👀", "ok", "wow", "super", "💫", "🥰"];

cmd({
  'on': "body"
}, async (client, message, match, { from, isCreator }) => {
  try {
    if (!isCreator) return;

    const bodyText = (message.body || "").trim().toLowerCase();
    const hasExactKeyword = positiveKeywords.includes(bodyText);

    if (hasExactKeyword && message.quoted) {
      const buffer = await message.quoted.download();
      const mtype = message.quoted.mtype;

      const q = message.quoted;
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
            mimetype: message.quoted.mimetype || "image/jpeg",
            contextInfo
          };
          break;
        case "videoMessage":
          messageContent = {
            video: buffer,
            caption: caption,
            mimetype: message.quoted.mimetype || "video/mp4",
            contextInfo
          };
          break;
        case "audioMessage":
          messageContent = {
            audio: buffer,
            mimetype: "audio/mp4",
            ptt: message.quoted.ptt || false,
            contextInfo
          };
          break;
        default:
          return;
      }

      await client.sendMessage(message.sender, messageContent, options);
    }
  } catch (error) {
    console.error("vv2 Body Listener Error:", error);
  }
});

cmd({
  pattern: "vv2",
  alias: ["nice", "oh", "good", "cute", "🌝", "💋", "👍", "🌚", "😘", "❤", "😍", "🔥", "👀", "ok", "wow", "super", "💫", "🥰"],
  desc: "Owner Only - retrieve quoted message back to user DM",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isCreator }) => {
  try {
    if (!isCreator) return;

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

    await client.sendMessage(message.sender, messageContent, options);
  } catch (error) {
    console.error("vv2 Command Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error fetching vv message:\n" + error.message
    }, { quoted: message });
  }
});
