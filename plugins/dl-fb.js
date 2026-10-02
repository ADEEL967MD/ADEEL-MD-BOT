const axios = require("axios");
const { cmd } = require("../command");

const fbCaption = `*📥 FB VIDEO DOWNLOADER*

> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ* 👑`;

cmd({
  pattern: "fb",
  alias: ["facebook", "fbvideo", "fb2", "facebook2", "fbvideo2"],
  react: "📥",
  desc: "Download Facebook videos via Adeel-Xtech API",
  category: "download",
  use: ".fb <Facebook video URL>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
  try {
    const fbUrl = args[0];

    if (!fbUrl || (!fbUrl.includes("facebook.com") && !fbUrl.includes("fb.watch") && !fbUrl.includes("fb.gg"))) {
      return reply("⚠️ Please provide a valid Facebook video link.\nExample: .fb https://facebook.com/...");
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

    const apiUrl = `https://adeel-xtech-apis.vercel.app/api/fbdl?url=${encodeURIComponent(fbUrl)}`;
    const { data } = await axios.get(apiUrl, { timeout: 20000 });

    if (!data || !data.status) {
      return reply("❌ Video not found. The video might be private or the link is incorrect.");
    }

    const videoLink = data.hd_link || data.sd_link || data.download_url;

    if (!videoLink) {
      return reply("❌ Failed to retrieve video download URL.");
    }

    await conn.sendMessage(from, {
      video: { url: videoLink },
      caption: fbCaption
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("FB command error:", error);
    reply("❌ Failed to download video. Please try again later.");
    try { await conn.sendMessage(from, { react: { text: "❌", key: m.key } }); } catch {}
  }
});
