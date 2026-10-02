const converter = require('../lib/converter');
const stickerMaker = require('../lib/sticker-maker');
const { cmd } = require('../command');

cmd({
    pattern: 'toimg',
    alias: ['toimage', 'tophoto'],
    desc: 'Convert stickers to images',
    category: 'media',
    react: '🖼️',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        if (!m.quoted || m.quoted.mtype !== 'stickerMessage') {
            return reply("✨ *Sticker Converter*\n\nPlease reply to a sticker message to convert it into an image.\n\nExample: `.toimg` (reply to a sticker)");
        }

        const stickerBuffer = await m.quoted.download();
        if (!stickerBuffer) return;

        const imageBuffer = await stickerMaker.convertStickerToImage(stickerBuffer);

        await conn.sendMessage(from, {
            image: imageBuffer,
            caption: '> *sᴛɪᴄᴋᴇʀ ᴛᴏ ɪᴍɢ*'
        }, { quoted: mek });

    } catch (e) {
        console.error('convert error:', e);
        await reply("❌ Failed to convert sticker to image.");
    }
});

cmd({
    pattern: 'tovideo',
    alias: ['tovid', 'tomp4'],
    desc: 'Convert animated stickers to MP4 video',
    category: 'media',
    react: '🎬',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        if (!m.quoted || m.quoted.mtype !== 'stickerMessage') {
            return reply("✨ *Sticker to Video*\n\nPlease reply to an animated sticker to convert it into an MP4.\n\nExample: `.tovideo` (reply to an animated sticker)");
        }

        const stickerBuffer = await m.quoted.download();
        if (!stickerBuffer) return;

        const videoBuffer = await stickerMaker.convertStickerToVideo(stickerBuffer);

        await conn.sendMessage(from, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            caption: '> *sᴛɪᴄᴋᴇʀ ᴛᴏ ᴠɪᴅᴇᴏ*'
        }, { quoted: mek });

    } catch (e) {
        console.error('tovideo error:', e);
        await reply("❌ Failed to convert sticker to video. Make sure it's an animated sticker.");
    }
});

cmd({
    pattern: 'tomp3',
    desc: 'Convert media to audio',
    category: 'audio',
    react: '🎵',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    if (!m.quoted) {
        return reply("*🔊 Please reply to a video/audio message*");
    }

    if (!['videoMessage', 'audioMessage'].includes(m.quoted.mtype)) {
        return reply("❌ Only video/audio messages can be converted");
    }

    const durationSec = m.quoted.message?.[m.quoted.mtype]?.seconds || 0;
    if (durationSec > 300) {
        return reply("⏱️ Media too long (max 5 minutes)");
    }

    await reply("🔄 Converting to audio...");

    try {
        const buffer = await m.quoted.download();
        const ext = m.quoted.mtype === 'videoMessage' ? 'mp4' : 'm4a';
        const audio = await converter.toAudio(buffer, ext);

        await conn.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: mek });

    } catch (e) {
        console.error('Conversion error:', e.message);
        await reply("❌ Failed to process audio");
    }
});

cmd({
    pattern: 'toptt',
    desc: 'Convert media to voice message',
    category: 'audio',
    react: '🎙️',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    if (!m.quoted) {
        return reply("*🗣️ Please reply to a video/audio message*");
    }

    if (!['videoMessage', 'audioMessage'].includes(m.quoted.mtype)) {
        return reply("❌ Only video/audio messages can be converted");
    }

    const durationSec = m.quoted.message?.[m.quoted.mtype]?.seconds || 0;
    if (durationSec > 60) {
        return reply("⏱️ Media too long for voice (max 1 minute)");
    }

    await reply("🔄 Converting to voice message...");

    try {
        const buffer = await m.quoted.download();
        const ext = m.quoted.mtype === 'videoMessage' ? 'mp4' : 'm4a';
        const ptt = await converter.toPTT(buffer, ext);

        await conn.sendMessage(from, {
            audio: ptt,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: mek });

    } catch (e) {
        console.error('PTT conversion error:', e.message);
        await reply("❌ Failed to create voice message");
    }
});

cmd({
    pattern: 'voice',
    alias: ['tov', 'tovoice'],
    desc: 'Convert media to voice message',
    category: 'audio',
    react: '🎙️',
    filename: __filename
}, async (conn, mek, m, { from, reply, isOwner, args }) => {

    if (!m.quoted) {
        return reply("*🗣️ Please reply to a video/audio message*");
    }

    try {

        let targetJid = from;
        const input = args.join('').trim();

        if (input) {
            if (!isOwner) {
                return reply("*📛 ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ sᴇɴᴅ ᴠᴏɪᴄᴇ ᴛᴏ ᴀɴᴏᴛʜᴇʀ ᴄʜᴀᴛ.*");
            }

            if (input.includes('@g.us')) {
                targetJid = input.trim();
            } else {
                const numberOnly = input.replace(/\D/g, '');
                if (numberOnly.length > 5) {
                    const formatted = numberOnly.startsWith('0')
                        ? '92' + numberOnly.slice(1)
                        : numberOnly;
                    targetJid = formatted + '@s.whatsapp.net';
                }
            }
        }

        const buffer = await m.quoted.download();
        if (!buffer) return;

        const ext =
            m.quoted.mtype === 'videoMessage' ? 'mp4' :
            m.quoted.mtype === 'audioMessage' ? 'm4a' :
            null;

        if (!ext) {
            return reply("❌ Only video/audio messages can be converted");
        }

        const durationSec = m.quoted.message?.[m.quoted.mtype]?.seconds || 0;
        if (durationSec > 600) {
            return reply("⏱️ Media too long (max 10 minutes)");
        }

        const ptt = await converter.toPTT(buffer, ext);

        await conn.sendMessage(targetJid, {
            audio: ptt,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        });

        if (targetJid === from) {
            await conn.sendMessage(from, {
                react: { text: "✅", key: mek.key }
            });
        }

    } catch (e) {
        console.error('PTT Error:', e);
        await reply("❌ Failed to create voice message");
    }

});
