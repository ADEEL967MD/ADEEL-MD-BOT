const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "Pinterest",
    alias: ["pin", "pinterestdl", "pindl", "pinphoto", "pinimg", "pinpic", "pinterestphoto"],
    react: "📌",
    desc: "Download Pinterest photos using link",
    category: "download",
    use: ".pindl <Pinterest photo link>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, args }) => {
    try {
        const url = q || args[0];

        if (!url) {
            return reply("⚠️ Please provide a Pinterest link.\nExample: .Pinterest https://pin.it/xxx");
        }

        const validDomains = ["pin.it", "pinterest.com", "pinterest.co.uk", "pinterest.ca"];
        if (!validDomains.some(d => url.includes(d))) {
            return reply("⚠️ Please provide a valid Pinterest link.");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const api = `https://adeel-xtech-apis.vercel.app/api/pinterest-photo?url=${encodeURIComponent(url)}`;

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

        const imageUrl = data.result;

        const captionText = 
`📌 *PINTEREST IMAGE*\n\n` +
`> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ ⚡*`;

        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: captionText
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Pinterest photo error:", error.message);
        reply(`❌ Error: ${error.message}`);
        try { 
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); 
        } catch {}
    }
});
