const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

const downloadVideo = async (videoUrl) => {
    try {
        const res = await axios.get(
            `https://adeel-xtech-apis.vercel.app/api/ytmp4?url=${encodeURIComponent(videoUrl)}`,
            { timeout: 60000 }
        );
        const url = res.data?.result?.video_download;
        if (!res.data?.status || !url) throw new Error("No URL");
        return url;
    } catch (e) {
        return null;
    }
};

cmd({
    pattern: "video",
    alias: ["mp4"],
    desc: "Download video by name or link",
    category: "download",
    react: "🎬",
    filename: __filename
}, async (sock, message, m, { q }) => {

    const query = q ? q.trim() : "";

    if (!query) {
        return await sock.sendMessage(message.chat, {
            text: "❌ Please provide a video name or YouTube link"
        }, { quoted: message });
    }

    try {
        let video;
        const isYT = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(query);

        if (isYT) {
            let videoId = '';
            try {
                const urlObj = new URL(query);
                if (urlObj.hostname === 'youtu.be') {
                    videoId = urlObj.pathname.slice(1);
                } else {
                    videoId = urlObj.searchParams.get('v');
                }
            } catch {
                videoId = query.split('/').pop().split('?')[0];
            }

            if (!videoId) {
                return sock.sendMessage(message.chat, {
                    text: "❌ Invalid YouTube link"
                }, { quoted: message });
            }

            try {
                const search = await yts(videoId);
                if (search && search.videos && search.videos.length) {
                    video = search.videos[0];
                }
            } catch (e) {}

            if (!video) {
                try {
                    const search2 = await yts(`https://www.youtube.com/watch?v=${videoId}`);
                    if (search2 && search2.videos && search2.videos.length) {
                        video = search2.videos[0];
                    }
                } catch (e) {}
            }

            if (!video) {
                video = {
                    title: 'Unknown Title',
                    url: `https://www.youtube.com/watch?v=${videoId}`,
                    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                    timestamp: 'N/A',
                    views: 0,
                    author: { name: 'Unknown' }
                };
            }

        } else {
            const search = await yts(query);
            if (!search.videos.length) {
                return sock.sendMessage(message.chat, {
                    text: "❌ No video results found"
                }, { quoted: message });
            }
            video = search.videos[0];
        }

        const captionText =
            `*${video.title}*\n\n` +
            `🎥 *Channel:* ${video.author.name}\n` +
            `👁️ *Views:* ${(video.views || 0).toLocaleString()}\n` +
            `⏳ *Duration:* ${video.timestamp}\n\n` +
            `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ ⚡*`;

        await sock.sendMessage(message.chat, {
            image: { url: video.thumbnail },
            caption: captionText
        }, { quoted: message });

        await sock.sendMessage(message.chat, {
            react: { text: "⏳", key: message.key }
        });

        const downUrl = await downloadVideo(video.url);

        if (!downUrl) {
            await sock.sendMessage(message.chat, {
                react: { text: "❌", key: message.key }
            });
            return sock.sendMessage(message.chat, {
                text: "❌ All download servers are currently unavailable. Please try again later."
            }, { quoted: message });
        }

        await sock.sendMessage(message.chat, {
            video: { url: downUrl },
            mimetype: "video/mp4",
            caption: `*${video.title}*\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ ⚡*`
        }, { quoted: message });

        await sock.sendMessage(message.chat, {
            react: { text: "✅", key: message.key }
        });

    } catch (err) {
        console.log("Video Command Error:", err);
        await sock.sendMessage(message.chat, {
            text: "❌ An unexpected error occurred while processing your request."
        }, { quoted: message });
    }
});
