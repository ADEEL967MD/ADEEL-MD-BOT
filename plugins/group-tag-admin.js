const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions')

cmd({
    pattern: "tagadmins",
    alias: ["admin", "tagadmin", "gc_tagadmins"],
    react: "👑",
    desc: "To Tag all Admins of the Group",
    category: "group",
    use: '.tagadmins [message]',
    filename: __filename
},
async (conn, mek, m, { from, participants, reply, isGroup, senderNumber, groupAdmins, isBotAdmins, isOwner, command, args, body, userConfig }) => {
    try {
        if (!isGroup) return reply("*❌ This command can only be used in groups.*");

        if (!isBotAdmins && !isOwner) {
            return reply("*❌ Only Bot Owner can use this command when bot is not Admin.*");
        }

        let admins = await getGroupAdmins(participants);
        let totalAdmins = admins ? admins.length : 0;
        if (totalAdmins === 0) return reply("*❌ No admins found in this group.*");

        let emojis = ['👑', '⚡', '🌟', '✨', '🎖️', '💎', '🔱', '🛡️', '🚀', '🏆'];
        let randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        let userMessage = body.slice(body.indexOf(command) + command.length).trim();
        let displayMessage = userMessage ? userMessage : "Attention Admins";

        let teks = `*╭─═━━ ⚡ ADMINS ━━═─╮*\n` +
                   `*│* 👑 *Total Admins:* ${totalAdmins}\n` +
                   `*│* 💬 *Message:* ${displayMessage}\n` +
                   `*├──────────────────*\n`;

        for (let admin of admins) {
            if (!admin) continue;
            teks += `*│* ${randomEmoji} @${admin.split('@')[0]}\n`;
        }

        teks += `*╰─═━━━━━━━━━━━━━═─╯*\n\n` +
                `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ ⚡*`;

        await conn.sendMessage(from, { text: teks, mentions: admins }, { quoted: mek });

    } catch (e) {
        console.error("TagAdmins Error:", e);
        reply(`⚠️ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
