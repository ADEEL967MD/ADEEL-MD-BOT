const { cmd } = require('../command');
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const config = require('../config');
const StickerMaker = require('../lib/sticker-maker');
const crypto = require('crypto');

cmd(
    {
        pattern: 'sticker',
        alias: ['s', 'take', 'rename', 'stake', 'vsticker', 'gsticker', 'g2s', 'gs', 'v2s', 'vs'],
        desc: 'Create stickers from images, videos, GIFs with custom pack names',
        category: 'tools',
        react: "⚡",
        use: '<reply media> | <pack name>',
        filename: __filename,
    },
    async (conn, mek, m, { q, reply, from, userConfig }) => {
        if (!m.quoted) return reply("*Reply to any Image, Video, GIF, or Sticker*");
        
        let mime = m.quoted.mtype;
        const defaultPackName = userConfig?.STICKER_NAME || config.STICKER_NAME || "ADEEL-MD ⚡";
        let pack = q ? q : defaultPackName;
        
        try {
            let media, stickerBuffer;
            
            if (mime === "imageMessage" || mime === "stickerMessage") {
                media = await m.quoted.download();
                
                let sticker = new Sticker(media, {
                    pack: pack, 
                    type: StickerTypes.FULL,
                    categories: ["🤩", "🎉"],
                    id: crypto.randomBytes(4).toString('hex'),
                    quality: 75,
                    background: 'transparent',
                });
                stickerBuffer = await sticker.toBuffer();
                
            } else if (mime === "videoMessage") {
                media = await m.quoted.download();
                const webpBuffer = await StickerMaker.videoToWebp(media);
                
                let sticker = new Sticker(webpBuffer, {
                    pack: pack,
                    type: StickerTypes.FULL,
                    categories: ["🤩", "🎉"],
                    id: crypto.randomBytes(4).toString('hex'),
                    quality: 75,
                    background: 'transparent',
                });
                stickerBuffer = await sticker.toBuffer();
                
            } else {
                return reply("*Please reply to an image, video, GIF, or sticker*");
            }
            
            return conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });
            
        } catch (error) {
            console.error("Sticker creation error:", error);
            return reply(`❌ Error creating sticker: ${error.message}`);
        }
    }
);

cmd({
    pattern: "attp",
    desc: "Convert text to a GIF sticker.",
    react: "✨",
    category: "tools", 
    use: ".attp HI",
    filename: __filename,
}, async (conn, mek, m, { args, reply, from }) => {
    try {
        if (!args[0]) return reply("*Please provide text!*");

        const gifBuffer = await StickerMaker.fetchGif(`https://api-fix.onrender.com/api/maker/attp?text=${encodeURIComponent(args.join(' '))}`);
        const stickerBuffer = await StickerMaker.gifToSticker(gifBuffer);

        await conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });
    } catch (error) {
        console.error("ATTP error:", error);
        reply(`❌ ${error.message}`);
    }
});

cmd({
    pattern: "stickertophoto",
    alias: ["stimg", "stoimg", "stickertoimg"],
    desc: "Convert a sticker back to an image / photo.",
    react: "🖼️",
    category: "tools",
    use: "Reply to a sticker",
    filename: __filename,
}, async (conn, mek, m, { reply, from }) => {
    try {
        if (!m.quoted) return reply("*Please reply to a sticker!*");
        
        let mime = m.quoted.mtype;
        if (mime !== "stickerMessage") {
            return reply("*This is not a sticker! Please reply to a valid sticker.*");
        }

        const stickerBuffer = await m.quoted.download();
        const imageBuffer = await StickerMaker.convertStickerToImage(stickerBuffer);

        await conn.sendMessage(from, { image: imageBuffer }, { quoted: mek });
    } catch (error) {
        console.error("Sticker to image conversion error:", error);
        reply(`❌ Failed to convert sticker to photo: ${error.message}`);
    }
});
