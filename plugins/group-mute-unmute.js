const { cmd } = require('../command');
const { sleep } = require('../lib/functions');

function parseTime(timeStr) {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+)\s*([smh])/i);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    if (unit === "s") return value * 1000;
    if (unit === "m") return value * 60 * 1000;
    if (unit === "h") return value * 60 * 60 * 1000;
    return 0;
}

cmd({
    pattern: "close",
    alias: ["groupclose", "mute"],
    react: "🔇",
    desc: "Mute group immediately or after delay",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply }) => {
    try {
        if (!isGroup) return;
        if (!isAdmins && !isOwner) return;

        const delay = args[0] ? parseTime(args[0]) : 0;

        if (delay > 0) {
            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
            await reply(`⏳ Group will be muted in ${args[0]}`);
            
            setTimeout(async () => {
                await conn.groupSettingUpdate(from, "announcement");
                await conn.sendMessage(from, { text: `*🔇 Group Muted Successfully*` }, { quoted: mek });
                await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            }, delay);
        } else {
            await conn.groupSettingUpdate(from, "announcement");
            await conn.sendMessage(from, { text: "*🔇 Group Muted Successfully*" }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }
    } catch (e) {
        console.error("Group Close Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ Failed to close group. Make sure bot is an admin.");
    }
});

cmd({
    pattern: "open",
    alias: ["groupopen", "unmute"],
    react: "🔊",
    desc: "Unmute group immediately or after delay",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply }) => {
    try {
        if (!isGroup) return;
        if (!isAdmins && !isOwner) return;

        const delay = args[0] ? parseTime(args[0]) : 0;

        if (delay > 0) {
            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
            await reply(`⏳ Group will be unmuted in ${args[0]}`);
            
            setTimeout(async () => {
                await conn.groupSettingUpdate(from, "not_announcement");
                await conn.sendMessage(from, { text: `*🔊 Group Unmuted Successfully*` }, { quoted: mek });
                await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            }, delay);
        } else {
            await conn.groupSettingUpdate(from, "not_announcement");
            await conn.sendMessage(from, { text: "*🔊 Group Unmuted Successfully*" }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }
    } catch (e) {
        console.error("Group Open Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ Failed to open group. Make sure bot is an admin.");
    }
});
