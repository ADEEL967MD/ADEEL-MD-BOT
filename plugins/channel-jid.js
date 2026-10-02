const { cmd } = require('../command');

function extractInviteId(text) {
    if (!text) return null;
    const match = String(text).match(/whatsapp\.com\/channel\/([\w-]+)/i);
    return match ? match[1] : null;
}

function extractNewsletterJid(text) {
    if (!text) return null;
    const match = String(text).match(/(\d{10,}@newsletter)/i);
    return match ? match[1] : null;
}

function getText(m, q) {
    let t = '';
    if (q) t += ' ' + q;
    if (m?.text) t += ' ' + m.text;
    if (m?.body) t += ' ' + m.body;
    if (m?.quoted) {
        const qm = m.quoted.message || {};
        t += ' ' + (
            qm.conversation ||
            qm.extendedTextMessage?.text ||
            qm.imageMessage?.caption ||
            qm.videoMessage?.caption ||
            m.quoted.text ||
            m.quoted.body ||
            ''
        );
    }
    return t.trim();
}

cmd({
    pattern: 'cjid',
    alias: ['channeljid', 'jidchannel', 'getjid', 'newsletterjid', 'chjid'],
    desc: 'Get channel JID from link or reply',
    react: '📢',
    category: 'utility',
    filename: __filename
}, async (conn, mek, m, { reply, q }) => {
    try {
        const source = getText(m, q);
        const inviteId = extractInviteId(source);
        const jidDirect = extractNewsletterJid(source);

        if (!inviteId && !jidDirect) {
            return reply('⚠️ Channel link or JID required.\nReply to a message or use:\n.cjid https://whatsapp.com/channel/xxxxx');
        }

        if (jidDirect && !inviteId) {
            return reply(`*Channel JID*\n\`${jidDirect}\``);
        }

        let metadata;
        try {
            metadata = await conn.newsletterMetadata('invite', inviteId);
        } catch (e) {
            return reply('❌ Failed to fetch channel.');
        }

        if (!metadata || !metadata.id) {
            return reply('❌ Channel not found.');
        }

        return reply(`*Channel JID*\n\`${metadata.id}\``);

    } catch (e) {
        console.error('cjid error:', e);
        return reply('⚠️ Error: ' + e.message);
    }
});
