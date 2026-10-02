const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "capcut",
    alias: ["capcutdl", "capcuttemplate", "capcutvideo"],
    react: "🎬",
    desc: "Download CapCut template video using link",
    category: "download",
    use: ".capcut <CapCut link>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, args }) => {
    try {
        const url = q || args[0];

        if (!url) {
            return reply("⚠️ Please provide a CapCut link.\nExample: .capcut https://www.capcut.com/xxx");
        }

        const isCapCut = /(https?:\/\/)?(www\.)?(capcut\.com)\//i.test(url);
        if (!isCapCut) {
            return reply("⚠️ Please provide a valid CapCut link.");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const api = `https://adeel-xtech-apis.vercel.app/api/capcut?url=${encodeURIComponent(url)}`;

        const res = await axios.get(api, {
            timeout: 30000,
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json"
            }
        });

        const data = res.data;

        if (!data || !data.status || !data.result || !data.result.video_download) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not get download link. Please try again.");
        }

        const result = data.result;
        const videoUrl = result.video_download;
        const title = result.title || "CapCut Video";
        const author = result.author || "Unknown";
        const duration = result.duration || "N/A";
        const usage = result.usage ? Number(result.usage).toLocaleString() : "N/A";
        const likes = result.likes ? Number(result.likes).toLocaleString() : "N/A";

        const captionText = 
`🎬 *CAPCUT DOWNLOADER*\n\n` +
`📌 *Title:* ${title}\n` +
`👤 *Author:* ${author}\n` +
`⏳ *Duration:* ${duration}\n` +
`👥 *Usage:* ${usage}\n` +
`❤️ *Likes:* ${likes}\n\n` +
`> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ 👑`;

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: captionText,
            mimetype: "video/mp4"
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("CapCut video error:", error.message);
        reply(`❌ Error: ${error.message}`);
        try { 
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); 
        } catch {}
    }
});
