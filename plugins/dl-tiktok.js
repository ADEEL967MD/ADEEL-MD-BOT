const axios = require("axios");
const { cmd } = require("../command");

cmd({
    pattern: "tiktok",
    alias: ["tt", "tiktokdl", "ttdl"],
    react: "🎵",
    desc: "Download TikTok videos",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
    try {
        const url = args[0];

        if (!url) {
            return reply("⚠️ Please provide a TikTok link.");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const { data } = await axios.get(
            `https://adeel-xtech-apis.vercel.app/api/ttdl?url=${encodeURIComponent(url)}`,
            { timeout: 30000, headers: { "User-Agent": "Mozilla/5.0" } }
        );

        if (!data?.status || !data?.result?.video) {
            return reply("❌ Could not get download link. Please try again.");
        }

        const caption = `🎵 *TIKTOK VIDEO* 🎵\n\n📖 *TITLE:* ${data.result.title || "TikTok Video"}\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ* 👑`;

        await conn.sendMessage(from, {
            video: { url: data.result.video },
            caption: caption,
            mimetype: "video/mp4"
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        reply(`❌ Error: ${error.message}`);
        try { await conn.sendMessage(from, { react: { text: "❌", key: m.key } }); } catch {}
    }
});
