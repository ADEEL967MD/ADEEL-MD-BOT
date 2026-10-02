const axios = require("axios");
const { cmd } = require("../command");
const config = require("../config");

const FOOTER = config.DESCRIPTION || "";

cmd({
  pattern: "mediafire",
  alias: ["mfire", "mfdownload"],
  react: '📥',
  desc: "Download any file from MediaFire",
  category: "download",
  use: ".mediafire <MediaFire URL>",
  filename: __filename
}, async (conn, mek, m, { from, q }) => {
  try {
    if (!q || !q.includes("mediafire.com")) {
      await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
      return await conn.sendMessage(from, { text: "⚠️ Usage: .mediafire <MediaFire URL>" }, { quoted: mek });
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const apiUrl = `https://adeel-xtech-apis.vercel.app/api/mediafire?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data || !data.status || !data.result || !data.result.download_url) {
      await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
      return await conn.sendMessage(from, { text: "❌ Failed to fetch file info." }, { quoted: mek });
    }

    const { filename, mimetype, download_url } = data.result;

    const fileResponse = await axios.get(download_url, { responseType: 'arraybuffer' });
    const fileBuffer = Buffer.from(fileResponse.data);

    await conn.sendMessage(from, {
      document: fileBuffer,
      fileName: filename || "mediafire_file",
      mimetype: mimetype || 'application/octet-stream',
      caption: FOOTER
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

  } catch (error) {
    console.error("MediaFire Error:", error.message);
    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    await conn.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: mek });
  }
});
