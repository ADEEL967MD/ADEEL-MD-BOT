const { isJidGroup } = require('@whiskeysockets/baileys');
const { loadMessage } = require('./store');
const config = require('../config');

const getMessageContent = (msg) => {
    if (!msg) return '';

    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage?.caption) return msg.imageMessage.caption;
    if (msg.videoMessage?.caption) return msg.videoMessage.caption;

    if (msg.message) {
        if (msg.message.conversation) return msg.message.conversation;
        if (msg.message.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
        if (msg.message.imageMessage?.caption) return msg.message.imageMessage.caption;
        if (msg.message.videoMessage?.caption) return msg.message.videoMessage.caption;
    }

    return '';
};

const AntiEdit = async (conn, msg) => {
    if (!msg.message?.protocolMessage?.editedMessage) return;

    const userConfig = conn.userConfig || { ...config.DEFAULT_SETTINGS };

    if (userConfig.ANTI_EDIT !== "true") return;

    const protocolMsg = msg.message.protocolMessage;
    const messageId = protocolMsg.key.id;

    const originalMsg = await loadMessage(messageId);

    if (!originalMsg || !originalMsg.message) return;

    const originalMessageObj = originalMsg.message;

    if (originalMessageObj.key?.fromMe) return;

    const editorJid = msg.key.participant || msg.key.remoteJid;
    const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    if (editorJid === botNumber) return;

    const originalText = getMessageContent(originalMessageObj);

    const editedText = getMessageContent(protocolMsg.editedMessage);

    if (!originalText && !editedText) return;

    const sender = originalMessageObj.key?.participant || originalMessageObj.key?.remoteJid;
    if (!sender) return;

    const senderNumber = sender.split('@')[0];

    const isGroup = isJidGroup(originalMsg.jid);

    let alertInfo, jid;

    if (isGroup) {
        try {
            alertInfo = `*╭────⬡ ADEEL-MD ⬡────*
*├▢ SENDER :* @${senderNumber}
*├▢ ACTION :* Edited a Message*`;
            jid = userConfig.ANTIEDIT_PATH === "inbox"
                ? conn.user.id.split(':')[0] + "@s.whatsapp.net"
                : originalMsg.jid;
        } catch (e) {
            return;
        }
    } else {
        alertInfo = `*╭────⬡ ADEEL-MD ⬡────*
*├▢ SENDER :* @${senderNumber}
*├▢ ACTION :* Edited a Message*`;
        jid = userConfig.ANTIEDIT_PATH === "inbox"
            ? conn.user.id.split(':')[0] + "@s.whatsapp.net"
            : originalMsg.jid;
    }

    const alertText = `*⚠️ Edited Message Alert 🚨*
${alertInfo}
*╰▢ MESSAGE :* Content Below 🔽

*╭─ ORIGINAL ─╮*

${originalText || '[Empty]'}

*╰─ EDITED TO ─╯*

${editedText || '[Empty]'}`;

    const mentionedJid = [sender];
    if (msg.key.participant && msg.key.participant !== sender) {
        mentionedJid.push(msg.key.participant);
    }

    try {
        await conn.sendMessage(jid, {
            text: alertText,
            contextInfo: { mentionedJid: mentionedJid.length ? mentionedJid : undefined }
        }, { quoted: originalMessageObj }).catch(e => {
            if (e.message?.includes('rate-overlimit') || e.message?.includes('429')) return;
        });
    } catch (error) {
    }
};

module.exports = { AntiEdit };