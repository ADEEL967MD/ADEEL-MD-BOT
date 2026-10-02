const { cmd } = require('../command');

async function lidToPhone(conn, lid) {
    try {
        const pn = await conn.signalRepository.lidMapping.getPNForLID(lid);
        if (pn) {
            return cleanPN(pn);
        }
        return lid.split("@")[0];
    } catch (e) {
        return lid.split("@")[0];
    }
}

function cleanPN(pn) {
    return pn.split(":")[0];
}

cmd({
    pattern: "id",
    alias: ["chatid", "jid", "gjid", "channelid", "newsletter", "cid"],  
    desc: "Get various IDs (chat, user, group, or channel)",
    react: "⚡",
    category: "utility",
    filename: __filename,
}, async (conn, mek, m, { 
    from, isGroup, reply, sender, fromMe, botNumber2
}) => {
    try {
        if (m.text && m.text.includes('whatsapp.com/channel/')) {
            const match = m.text.match(/whatsapp\.com\/channel\/([\w-]+)/);
            if (!match) return reply("*❌ Invalid Channel Link Format*\n\n> Make sure it looks like:\n> https://whatsapp.com/channel/0029Vawbj7e5kg7AFF5MuZ28");

            const inviteId = match[1];
            let metadata;
            
            try {
                metadata = await conn.newsletterMetadata("invite", inviteId);
            } catch (e) {
                return reply("*❌ Failed to fetch channel metadata.* Make sure the link is correct.");
            }

            if (!metadata || !metadata.id) return reply("*❌ Channel not found or inaccessible.*");

            return reply(`📢 *CHANNEL METADATA*\n\n🆔 *Channel ID:* \`${metadata.id}\``);
        }

        if (isGroup) {
            const groupJID = from.includes('@g.us') ? from : `${from}@g.us`;
            return reply(`👥 *GROUP DETAILS*\n\n🆔 *Group JID:* \`${groupJID}\``);
            
        } else {
            if (fromMe) {
                const botPN = botNumber2.split('@')[0];
                return reply(`🤖 *BOT DETAILS*\n\n👤 *Your ID:* \`${botPN}@s.whatsapp.net\``);
            } else {
                let senderPN = sender.split('@')[0];
                
                if (sender.includes('@lid')) {
                    senderPN = await lidToPhone(conn, sender);
                }
                
                return reply(`👤 *USER DETAILS*\n\n🆔 *Your ID:* \`${senderPN}@s.whatsapp.net\``);
            }
        }

    } catch (e) {
        console.error("ID Command Error:", e);
        return reply(`⚠️ *Error:* ${e.message}`);
    }
});

cmd({
    pattern: "getlid",
    alias: ["lidonly", "lid", "mylid"],  
    desc: "Get your LID (@lid) directly without conversion",
    react: "🆔",
    category: "utility",
    filename: __filename,
}, async (conn, mek, m, { 
    from, isGroup, reply, sender, fromMe, botNumber2, mentionUser
}) => {
    try {
        const mentionedUser = mentionUser ? mentionUser[0] : null;
        
        if (mentionedUser) {
            if (mentionedUser.includes('@lid')) {
                return reply(`👤 *USER LID DETAILS*\n\n🆔 *LID:* \`${mentionedUser}\``);
            } else {
                return reply("*⚠️ Mentioned user is not in LID format.*");
            }
        }
        
        if (isGroup) {
            if (sender.includes('@lid')) {
                return reply(`👤 *YOUR LID DETAILS*\n\n🆔 *LID:* \`${sender}\``);
            } else {
                return reply("*⚠️ You don't have a LID format in this chat.*");
            }
        } else {
            if (fromMe) {
                if (botNumber2.includes('@lid')) {
                    return reply(`🤖 *BOT LID DETAILS*\n\n🆔 *LID:* \`${botNumber2}\``);
                } else {
                    return reply(`🤖 *BOT NUMBER DETAILS*\n\n📱 *Number:* \`${botNumber2}\``);
                }
            } else {
                if (sender.includes('@lid')) {
                    return reply(`👤 *YOUR LID DETAILS*\n\n🆔 *LID:* \`${sender}\``);
                } else {
                    return reply(`*⚠️ You don't have a LID format.*\n\n🆔 *Current ID:* \`${sender}\``);
                }
            }
        }

    } catch (e) {
        console.error("GetLID Command Error:", e);
        return reply(`⚠️ *Error:* ${e.message}`);
    }
});
