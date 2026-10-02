const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');

const tempFile = (ext) => path.join(os.tmpdir(), `${crypto.randomBytes(6).toString('hex')}.${ext}`);

cmd({
    pattern: "terabox",
    alias: ["tera", "tbx", "terabox2"],
    desc: "Download Terabox video",
    category: "download",
    react: "📦",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {

    let outputPath;

    try {

        if (!q) return reply("❌ Please send a Terabox link");

        const url = q.trim();

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const { data } = await axios.get(
            `https://jerryproxy.vercel.app/api/download?url=${encodeURIComponent(url)}`,
            { timeout: 30000, headers: { "User-Agent": "Mozilla/5.0" } }
        );

        if (!data.status || !data.result?.files?.length) return reply("❌ Failed to fetch video");

        const file = data.result.files[0];
        const streamUrl = file?.streams?.["720p"] || file?.streams?.["480p"] || file?.streams?.["360p"];
        const downloadUrl = file?.download;

        if (!streamUrl && !downloadUrl) return reply("❌ No downloadable video found");

        const quality = file?.streams?.["720p"] ? "720p" : file?.streams?.["480p"] ? "480p" : "360p";
        const fileName = file.file_name || `terabox_${Date.now()}.mp4`;
        const caption = `🎬 *${fileName}*\n\n📦 Size: ${file.size_mb || "Unknown"}\n📥 Quality: ${quality}\n\n> ⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ ⚡`;

        if (file.thumbnail) {
            try {
                await conn.sendMessage(from, { image: { url: file.thumbnail }, caption }, { quoted: mek });
            } catch {}
        }

        outputPath = tempFile('mp4');
        let downloadSuccess = false;

        if (streamUrl) {
            try {
                await new Promise((resolve, reject) => {
                    ffmpeg(streamUrl)
                        .inputOptions([
                            '-protocol_whitelist', 'file,http,https,tcp,tls,crypto',
                            '-allowed_extensions', 'ALL',
                            '-headers', 'User-Agent: Mozilla/5.0\r\nReferer: https://terabox.com/\r\n'
                        ])
                        .outputOptions([
                            '-c:v copy',
                            '-c:a aac',
                            '-bsf:a aac_adtstoasc',
                            '-movflags +faststart'
                        ])
                        .format('mp4')
                        .on('end', () => {
                            downloadSuccess = true;
                            resolve();
                        })
                        .on('error', reject)
                        .save(outputPath);
                });
            } catch {
                downloadSuccess = false;
            }
        }

        if (!downloadSuccess && downloadUrl) {
            const writer = fs.createWriteStream(outputPath);
            const response = await axios({
                method: 'get',
                url: downloadUrl,
                responseType: 'stream',
                timeout: 1200000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                headers: { "User-Agent": "Mozilla/5.0" }
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        }

        if (!fs.existsSync(outputPath)) return reply("❌ Download failed from all sources");

        const stats = fs.statSync(outputPath);
        if (stats.size < 10000) {
            fs.unlinkSync(outputPath);
            return reply("❌ Invalid video file downloaded");
        }

        await conn.sendMessage(from, {
            document: { url: outputPath },
            mimetype: 'video/mp4',
            fileName,
            caption: file.thumbnail ? "" : caption
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ ${e.message}`);
    } finally {
        if (outputPath && fs.existsSync(outputPath)) {
            try { fs.unlinkSync(outputPath); } catch {}
        }
    }
});
