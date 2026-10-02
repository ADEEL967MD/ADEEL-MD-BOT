const config = require('../config');
const { proto, downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');
const fs = require('fs');

const isUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

const downloadMediaMessage = async (message, filename) => {
    try {
        if (!message || !message.msg) {
            throw new Error('Invalid message object');
        }

        let msg = message.msg;
        let mtype = message.mtype;

        if (mtype === 'viewOnceMessage' || mtype === 'viewOnceMessageV2') {
            if (message.message?.viewOnceMessage?.message) {
                msg = message.message.viewOnceMessage.message;
                mtype = getContentType(msg);
                msg = msg[mtype];
            }
        }

        let streamType = 'image';
        let extension = '';

        if (mtype === 'imageMessage') {
            streamType = 'image';
            extension = 'jpg';
        } else if (mtype === 'videoMessage') {
            streamType = 'video';
            extension = 'mp4';
        } else if (mtype === 'audioMessage') {
            streamType = 'audio';
            extension = 'mp3';
        } else if (mtype === 'stickerMessage') {
            streamType = 'sticker';
            extension = 'webp';
        } else if (mtype === 'documentMessage') {
            streamType = 'document';
            extension = msg.fileName ? msg.fileName.split('.').pop() : 'bin';
        } else {
            throw new Error('Unsupported message type');
        }

        const stream = await downloadContentFromMessage(msg, streamType);
        let buffer = Buffer.from([]);

        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        if (filename) {
            const filePath = filename + '.' + extension;
            fs.writeFileSync(filePath, buffer);
            return fs.readFileSync(filePath);
        }

        return buffer;

    } catch (error) {
        console.error('[DOWNLOAD MEDIA] Error:', error);
        throw error;
    }
};

const sms = (conn, m, store) => {
    if (!m) return m;

    try {
        let M = proto.WebMessageInfo;

        if (m.key) {
            m.id = m.key.id;
            m.isBot = m.id ? (m.id.startsWith('BAES') && m.id.length === 16) : false;
            m.isBaileys = m.id ? (m.id.startsWith('BAE5') && m.id.length === 16) : false;
            m.chat = m.key.remoteJid;
            m.fromMe = m.key.fromMe;
            m.isGroup = m.chat ? m.chat.endsWith('@g.us') : false;
            m.sender = m.fromMe ? (conn.user ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : '') :
                       (m.isGroup ? m.key.participant : m.key.remoteJid);
        }

        if (m.message) {
            m.mtype = getContentType(m.message);

            if (m.mtype === 'viewOnceMessage' || m.mtype === 'viewOnceMessageV2') {
                try {
                    if (m.message.viewOnceMessage && m.message.viewOnceMessage.message) {
                        m.message = m.message.viewOnceMessage.message;
                        m.mtype = getContentType(m.message);
                    }
                } catch (e) {
                    console.log('[VIEW ONCE] Error handling viewOnceMessage:', e.message);
                }
            }

            if (m.mtype === 'ephemeralMessage') {
                try {
                    if (m.message.ephemeralMessage && m.message.ephemeralMessage.message) {
                        m.message = m.message.ephemeralMessage.message;
                        m.mtype = getContentType(m.message);
                    }
                } catch (e) {
                    console.log('[EPHEMERAL] Error handling ephemeralMessage:', e.message);
                }
            }

            try {
                if (m.mtype === 'viewOnceMessage' || m.mtype === 'viewOnceMessageV2') {
                    m.msg = m.message[m.mtype]?.message ?
                            m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] :
                            {};
                } else {
                    m.msg = m.message[m.mtype] || {};
                }
            } catch (e) {
                m.msg = {};
            }

            try {
                m.body = '';
                if (m.mtype === 'conversation' && m.message.conversation) {
                    m.body = m.message.conversation;
                } else if (m.mtype === 'imageMessage' && m.message.imageMessage && m.message.imageMessage.caption) {
                    m.body = m.message.imageMessage.caption;
                } else if (m.mtype === 'videoMessage' && m.message.videoMessage && m.message.videoMessage.caption) {
                    m.body = m.message.videoMessage.caption;
                } else if (m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage && m.message.extendedTextMessage.text) {
                    m.body = m.message.extendedTextMessage.text;
                } else if (m.mtype === 'buttonsResponseMessage' && m.message.buttonsResponseMessage) {
                    m.body = m.message.buttonsResponseMessage.selectedButtonId || '';
                } else if (m.mtype === 'listResponseMessage' && m.message.listResponseMessage) {
                    m.body = m.message.listResponseMessage.singleSelectReply?.selectedRowId || '';
                } else if (m.mtype === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage) {
                    m.body = m.message.templateButtonReplyMessage.selectedId || '';
                } else if (m.mtype === 'messageContextInfo') {
                    m.body = m.message.buttonsResponseMessage?.selectedButtonId ||
                             m.message.listResponseMessage?.singleSelectReply?.selectedRowId || '';
                }
            } catch (e) {
                m.body = '';
            }

            let quoted = null;
            if (m.msg && m.msg.contextInfo && m.msg.contextInfo.quotedMessage) {
                quoted = m.msg.contextInfo.quotedMessage;
                m.quoted = quoted;
            } else {
                m.quoted = null;
            }

            m.mentionedJid = [];
            if (m.msg && m.msg.contextInfo && m.msg.contextInfo.mentionedJid) {
                m.mentionedJid = m.msg.contextInfo.mentionedJid;
            }

            if (m.quoted) {
                try {
                    let type = getContentType(quoted);
                    m.quoted = quoted[type];

                    if (!m.quoted) {
                        m.quoted = {};
                    }

                    if (['productMessage'].includes(type) && m.quoted) {
                        type = getContentType(m.quoted);
                        m.quoted = m.quoted[type] || {};
                    }

                    if (typeof m.quoted === 'string') {
                        m.quoted = { text: m.quoted };
                    }

                    m.quoted.mtype = type;
                    m.quoted.id = (m.msg && m.msg.contextInfo) ? m.msg.contextInfo.stanzaId : '';
                    m.quoted.chat = (m.msg && m.msg.contextInfo) ?
                                    (m.msg.contextInfo.remoteJid || m.chat) : m.chat;
                    m.quoted.isBot = m.quoted.id ?
                                    (m.quoted.id.startsWith('BAES') && m.quoted.id.length === 16) : false;
                    m.quoted.isBaileys = m.quoted.id ?
                                        (m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16) : false;
                    m.quoted.sender = (m.msg && m.msg.contextInfo) ?
                                     conn.decodeJid(m.msg.contextInfo.participant) : '';
                    m.quoted.fromMe = m.quoted.sender ?
                                     (m.quoted.sender === (conn.user && conn.user.id)) : false;
                    m.quoted.text = m.quoted.text || m.quoted.caption ||
                                    m.quoted.conversation || m.quoted.contentText ||
                                    m.quoted.selectedDisplayText || m.quoted.title || '';
                    m.quoted.mentionedJid = (m.msg && m.msg.contextInfo) ?
                                           (m.msg.contextInfo.mentionedJid || []) : [];
                    m.quoted.mimetype = m.quoted.mimetype || '';
                    m.quoted.ptt = m.quoted.ptt || false;

                    m.getQuotedObj = m.getQuotedMessage = async () => {
                        if (!m.quoted.id || !store) return false;
                        try {
                            let q = await store.loadMessage(m.chat, m.quoted.id, conn);
                            return q ? sms(conn, q, store) : false;
                        } catch (e) {
                            console.log('[GET QUOTED] Error:', e.message);
                            return false;
                        }
                    };

                    m.quoted.download = async () => {
                        try {
                            const quotedMsg = {
                                msg: m.quoted,
                                mtype: type,
                                message: quoted
                            };
                            return await downloadMediaMessage(quotedMsg);
                        } catch (error) {
                            console.error('[QUOTED DOWNLOAD] Error:', error);
                            throw error;
                        }
                    };

                } catch (e) {
                    console.log('[QUOTED PROCESS] Error:', e.message);
                    m.quoted = null;
                }
            }
        }

        if (m.msg && (m.msg.url || m.mtype)) {
            m.download = async () => {
                try {
                    return await downloadMediaMessage(m);
                } catch (error) {
                    console.error('[MAIN DOWNLOAD] Error:', error);
                    throw error;
                }
            };
        }

        m.text = '';
        if (m.msg) {
            m.text = m.msg.text || m.msg.caption || '';
        }
        if (!m.text && m.message && m.message.conversation) {
            m.text = m.message.conversation;
        }
        if (!m.text && m.msg) {
            m.text = m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || '';
        }

        m.copy = () => sms(conn, M.fromObject(M.toObject(m)), store);

        m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => {
            return conn.copyNForward(jid, m, forceForward, options);
        };

        m.react = (emoji) => {
            return conn.sendMessage(m.chat, {
                react: {
                    text: emoji,
                    key: m.key
                }
            });
        };

        return m;

    } catch (error) {
        console.error('[SMS] Critical error in sms function:', error);
        return m || {};
    }
};

module.exports = { sms, downloadMediaMessage };