const { cmd } = require("../command");

const commandKeywords = [
  "send", "sendme", "send me", "give me", "bhejo", "bhej do", "bhejdo",
  "bhej den", "bhejdena", "send karo", "send kar do", "karo send",
  "forward karo", "status send karo", "status bhejo", "send kr"
];

const saveWords = ["save", "sv"];
const saveEmojis = ["🤍", "🖤", "🥰", "😍"];

const normalizeId = (id) => {
  if (!id) return '';
  return String(id)
    .replace(/:[0-9]+/g, '')
    .replace(/@(lid|s.whatsapp.net|c.us|g.us)/g, '')
    .replace(/[^\d]/g, '');
};

const isSaveTrigger = (text) => {
  const t = String(text || "").replace(/\uFE0F/g, "").replace(/\s+/g, "").toLowerCase();
  if (!t) return false;
  if (saveWords.includes(t)) return true;
  return Array.from(t).every(ch => saveEmojis.includes(ch));
};

cmd({
  'on': "body"
}, async (client, message, store, {
  from,
  body,
  isGroup,
  sender,
  isMe
}) => {
  try {
    const botIds = [
      normalizeId(client?.user?.id),
      normalizeId(client?.user?.lid)
    ].filter(Boolean);

    const isBotId = (id) => {
      const n = normalizeId(id);
      return n !== '' && botIds.includes(n);
    };

    const key = message.key || {};
    const fromMe = key.fromMe === true || message.fromMe === true || isMe === true;

    if (isGroup) return;

    if (fromMe) {
      if (!isSaveTrigger(body)) return;

      const msgType = Object.keys(message.message || {})[0];
      const contextInfo = message.message?.[msgType]?.contextInfo || {};
      if (contextInfo.remoteJid !== 'status@broadcast') return;

      const quotedSelf = message.quoted;
      if (!quotedSelf) return;

      const botJid = client.user?.id
        ? client.user.id.split(":")[0] + "@s.whatsapp.net"
        : "";
      if (!botJid) return;

      const selfType = quotedSelf.mtype;
      const raw = quotedSelf.message?.[selfType] || {};
      const selfCaption = raw.caption || "";

      if (selfType === "conversation" || selfType === "extendedTextMessage") {
        const text = quotedSelf.message.conversation || quotedSelf.message.extendedTextMessage?.text || "";
        if (text) await client.sendMessage(botJid, { text });
        return;
      }

      if (!["imageMessage", "videoMessage", "audioMessage"].includes(selfType)) return;

      const selfBuffer = await quotedSelf.download();

      if (selfType === "imageMessage") {
        await client.sendMessage(botJid, { image: selfBuffer, caption: selfCaption, mimetype: raw.mimetype || "image/jpeg" });
      } else if (selfType === "videoMessage") {
        await client.sendMessage(botJid, { video: selfBuffer, caption: selfCaption, mimetype: raw.mimetype || "video/mp4" });
      } else if (selfType === "audioMessage") {
        await client.sendMessage(botJid, { audio: selfBuffer, mimetype: "audio/mp4", ptt: raw.ptt || false });
      }
      return;
    }

    if (isBotId(sender) || isBotId(from)) return;

    const messageText = (body || "").toLowerCase();
    const containsKeyword = commandKeywords.some(word => messageText.includes(word));
    if (!containsKeyword) return;

    const quotedMsg = message.quoted;
    if (!quotedMsg) return;

    const isDirectStatusQuoted =
      quotedMsg.chat === 'status@broadcast' ||
      quotedMsg.id?.includes('status@broadcast') ||
      quotedMsg.remoteJid === 'status@broadcast';

    if (!isDirectStatusQuoted) return;

    const buffer = await quotedMsg.download();
    const mtype = quotedMsg.mtype;
    const caption = quotedMsg.text || '';

    let messageContent = {};
    switch (mtype) {
      case "imageMessage":
        messageContent = { image: buffer, caption, mimetype: quotedMsg.mimetype || "image/jpeg" };
        break;
      case "videoMessage":
        messageContent = { video: buffer, caption, mimetype: quotedMsg.mimetype || "video/mp4" };
        break;
      case "audioMessage":
        messageContent = { audio: buffer, mimetype: "audio/mp4", ptt: quotedMsg.ptt || false };
        break;
      default:
        return;
    }

    await client.sendMessage(from, messageContent);
  } catch (error) {
    console.error("Status Plugin Error:", error);
  }
});
