const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: { 'User-Agent': 'Mozilla/5.0' }
};

async function getDownloadLink(url) {
    try {
        const res = await axios.get(
            `https://adeel-xtech-apis.vercel.app/api/ytmp4?url=${encodeURIComponent(url)}`,
            AXIOS_DEFAULTS
        );
        if (res.data?.status === true && res.data?.result?.video_download) {
            return res.data.result.video_download;
        }
        console.log("Adeel-Xtech API returned unexpected shape:", JSON.stringify(res.data));
    } catch (e) {
        console.log("Adeel-Xtech API Error:", e.message);
    }

    return null;
}

cmd({
    pattern: "drama",
    alias: ["darama"],
    desc: "Download YouTube dramas only (≥15 min) by name",
    category: "download",
    react: "🎬",
    filename: __filename
}, async (sock, message, m, { q, reply }) => {
    try {
        if (!q) return reply("⚠️ Please provide a Drama Name or Video Title!");

        if (q.includes("youtube.com/") || q.includes("youtu.be/"))
            return reply("❌ Links are not allowed. Please type the name only!");

        const search = await yts(q);
        const video = search.videos.find(v => v.seconds >= 900);
        if (!video) return reply("❌ No suitable drama found (≥15 min)!");

        const customName = "> *⚡ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ⚡*";
        const videoTitle = video.title;

        const captionBox = `╭━〔 *YT DOWNLOADER* 〕━┈⊷
┃ 🎬 *TITLE:* ${videoTitle}
┃ ⏱️ *DURATION:* ${video.timestamp}
┃ 👁️ *VIEWS:* ${video.views.toLocaleString()}
┃ 📺 *CHANNEL:* ${video.author.name}
╰━━━━━━━━━━━━━━━━┈⊷

*ᴘʟᴇᴀsᴇ ʀᴇᴘʟʏ ᴡɪᴛʜ ᴀ ɴᴜᴍʙᴇʀ*
(1) 📂 *ᴅᴏᴄᴜᴍᴇɴᴛ*
(2) 🎥 *ᴠɪᴅᴇᴏ*

${customName}`;

        const sentMsg = await sock.sendMessage(message.chat, {
            image: { url: video.thumbnail },
            caption: captionBox
        }, { quoted: message });

        const listener = async (chatUpdate) => {
            try {
                const msg = chatUpdate.messages[0];
                if (!msg.message?.extendedTextMessage) return;

                const selectedText = msg.message.extendedTextMessage.text.trim();
                const context = msg.message.extendedTextMessage.contextInfo;
                const isReplyToBot = context && context.stanzaId === sentMsg.key.id;
                if (!isReplyToBot) return;

                if (!["1", "2"].includes(selectedText)) return;

                // Remove listener immediately so it only runs once
                sock.ev.off("messages.upsert", listener);

                await sock.sendMessage(message.chat, {
                    react: { text: "⏳", key: msg.key }
                });

                const dlUrl = await getDownloadLink(video.url);
                if (!dlUrl) {
                    await sock.sendMessage(message.chat, {
                        react: { text: "❌", key: msg.key }
                    });
                    return sock.sendMessage(message.chat, {
                        text: "❌ Download server is currently unavailable. Please try again later."
                    }, { quoted: msg });
                }

                if (selectedText === "1") {
                    await sock.sendMessage(message.chat, {
                        document: { url: dlUrl },
                        mimetype: "video/mp4",
                        fileName: `${videoTitle}.mp4`,
                        caption: `*${videoTitle}*`
                    }, { quoted: msg });
                } else if (selectedText === "2") {
                    await sock.sendMessage(message.chat, {
                        video: { url: dlUrl },
                        mimetype: "video/mp4",
                        caption: `*${videoTitle}*\n\n${customName}`
                    }, { quoted: msg });
                }

                await sock.sendMessage(message.chat, {
                    react: { text: "✅", key: msg.key }
                });

            } catch (err) {
                console.error("Drama listener error:", err);
                try {
                    await sock.sendMessage(message.chat, {
                        text: "❌ Failed to send the file. Please try again."
                    });
                } catch (_) {}
            }
        };

        sock.ev.on("messages.upsert", listener);
        setTimeout(() => sock.ev.off("messages.upsert", listener), 120000);

    } catch (e) {
        console.error(e);
        reply("❌ System error occurred.");
    }
});
