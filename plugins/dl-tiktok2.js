const axios = require('axios');
const { cmd } = require("../command");

cmd({
  pattern: "tiktok2",
  alias: ["tt2", "ttdl2"],
  desc: "Direct TikTok Video Downloader",
  react: "📥",
  category: "download",
  use: ".tt2 <TikTok link>",
  filename: __filename
}, async (conn, mek, m, { from, q, args, reply }) => {
  try {
    const url = q || args[0];

    if (!url) {
      return reply("⚠️ Please provide a TikTok link.\nExample: .tiktok2 https://vt.tiktok.com/xxx/");
    }

    const isTikTok = /(https?:\/\/)?(www\.|vt\.|vm\.)?(tiktok\.com)\//i.test(url);
    if (!isTikTok) {
      return reply("⚠️ Please provide a valid TikTok link.");
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    const api = `https://adeel-xtech-apis.vercel.app/api/tiktok-v2?url=${encodeURIComponent(url)}`;

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
      return reply("❌ Could not fetch the video. Please try again.");
    }

    const r = data.result;
    const stats = r.stats || {};
    const author = r.author || {};

    const videoUrl = r.video_download;
    const title = r.title || 'No Title';
    const authorName = author.nickname || author.fullname || 'Unknown';
    const duration = r.duration || 'N/A';

    // Stats details
    const views = stats.views || '0';
    const likes = stats.likes || '0';
    const comments = stats.comment || '0';
    const shares = stats.share || '0';
    const saves = stats.save || '0';
    const downloads = stats.download || '0';

    const captionText = 
`🎬 *TIKTOK DOWNLOADER*\n\n` +
`📌 *Title:* ${title}\n` +
`👤 *Author:* ${authorName}\n` +
`⏳ *Duration:* ${duration}\n\n` +
`👁️ *Views:* ${views}\n` +
`❤️ *Likes:* ${likes}\n` +
`💬 *Comments:* ${comments}\n` +
`🔗 *Shares:* ${shares}\n` +
`📁 *Saves:* ${saves}\n` +
`📥 *Downloads:* ${downloads}\n\n` +
`> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ ⚡*`;

    await conn.sendMessage(from, {
      video: { url: videoUrl },
      caption: captionText,
      mimetype: "video/mp4",
      fileName: "tiktok.mp4"
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (error) {
    console.error("TikTok Error:", error.message);
    reply(`❌ Error: ${error.message}`);
    try { 
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); 
    } catch {}
  }
});
