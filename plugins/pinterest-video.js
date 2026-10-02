const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "pinvideo",
    alias: ["pinvid", "pinmp4", "pinterestvid"],
    react: "📌",
    desc: "Download Pinterest videos using link",
    category: "download",
    use: ".pinvideo <Pinterest video link>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, args }) => {
    try {
        const url = q || args[0];

        if (!url) {
            return reply("⚠️ Please provide a Pinterest link.\nExample: .pinvideo https://pin.it/xxx");
        }

        const validDomains = ["pin.it", "pinterest.com", "pinterest.co.uk", "pinterest.ca"];
        if (!validDomains.some(d => url.includes(d))) {
            return reply("⚠️ Please provide a valid Pinterest link.");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const api = `https://adeel-xtech-apis.vercel.app/api/pinterest-video?url=${encodeURIComponent(url)}`;

        const res = await axios.get(api, {
            timeout: 30000,
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json"
            }
        });

        const data = res.data;

        if (!data || !data.status || !data.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not get download link. Please try again.");
        }

        const videoUrl = data.result;
        const duration = data.duration || "N/A";
        const sizeMb = data.size_mb ? `${data.size_mb} MB` : "N/A";

        const captionText = 
`📌 *PINTEREST VIDEO*\n\n` +
`⏳ *Duration:* ${duration}\n` +
`📦 *Size:* ${sizeMb}\n\n` +
`> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ ⚡*`;

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: captionText,
            mimetype: "video/mp4"
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Pinterest video error:", error.message);
        reply(`❌ Error: ${error.message}`);
        try { 
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); 
        } catch {}
    }
});
