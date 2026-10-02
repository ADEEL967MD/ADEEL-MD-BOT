const axios = require("axios");
const { cmd } = require('../command');

async function downloadInstagram(url) {
    try {
        const res = await axios.get(
            `https://adeel-xtech-apis.vercel.app/api/igdl?url=${encodeURIComponent(url)}`,
            { timeout: 30000 }
        );

        const data = res.data;
        if (!data || !data.status || !Array.isArray(data.result) || !data.result.length) {
            return null;
        }

        const links = data.result
            .filter(item => item.download_url)
            .map(item => ({
                url: item.download_url,
                contentType: item.type === "video" ? "video/mp4" : "image/jpeg"
            }));

        return links.length ? [links[0]] : null;

    } catch (e) {
        console.error("Adeel-Xtech IGDL Error:", e.message);
        return null;
    }
}

cmd({
    pattern: "igdl",
    alias: ["instagram", "insta", "ig"],
    react: "⬇️",
    desc: "Download Instagram videos/reels",
    category: "download",
    use: ".igdl <Instagram URL>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        const url = q || m.quoted?.text;
        if (!url || !url.includes("instagram.com")) {
            return reply("❌ Please provide/reply to a valid Instagram link");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const results = await downloadInstagram(url);

        if (!results || !results.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
            return reply("❌ Invalid or private link.");
        }

        const caption = `*INSTAGRAM REEL 🎬*

> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ ⚡*`;

        for (const item of results) {
            if (!item.url) continue;
            const isVideo = item.contentType?.includes("video");
            await conn.sendMessage(from, {
                [isVideo ? "video" : "image"]: { url: item.url },
                caption
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("IGDL Error:", err.message);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply("❌ Download failed: " + err.message);
    }
});
