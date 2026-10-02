const config = require('../config')
const { cmd, commands } = require('../command');
const path = require('path');
const os = require("os")
const fs = require('fs');
const {runtime} = require('../lib/functions')
const axios = require('axios')
const converter = require('../lib/converter');

const NEWSLETTER_JID = '120363403380688821@newsletter';
const audioDir = path.join(__dirname, '../data/menu-voice');
let lastAudio = null;

const getRandomAudio = () => {
    if (!fs.existsSync(audioDir)) return null;
    const files = fs.readdirSync(audioDir).filter(f => /\.mp3$/i.test(f));
    if (!files.length) return null;
    const pool = files.length > 1 ? files.filter(f => f !== lastAudio) : files;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    lastAudio = pick;
    return path.join(audioDir, pick);
};

const toSmallCaps = (text) => {
    if (!text || typeof text !== 'string') return '';
    const smallCapsMap = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ',
        'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ',
        'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
    };
    return text.split('').map(char => smallCapsMap[char] || char).join('');
};

const formatCategory = (category, cmds, prefix = '.') => {
    const validCmds = cmds.filter(cmd => cmd.pattern && cmd.pattern.trim() !== '');

    if (validCmds.length === 0) return '';

    let title = `\n*╭─═━━━ ⚡ ${toSmallCaps(category.toUpperCase())} ━━━═─╮*\n`;
    let body = validCmds.map(cmd => {
        const commandName = cmd.pattern || '';
        return `*│ ✦ ${prefix}${commandName}*`;
    }).join('\n');
    let footer = `\n*╰─═━━━━━━━━━━━━━━═─╯*`;
    return `${title}${body}${footer}`;
};

const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === '') {
        return false;
    }
    return url.startsWith('http://') || url.startsWith('https://');
};

cmd({
    pattern: "menu",
    alias: ["m", "help", "allmenu","fullmenu"],
    use: '.menu',
    desc: "Show all bot commands",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, userConfig }) => {
    try {
        await conn.sendPresenceUpdate('composing', from);

        let totalCommands = Object.keys(commands).length;

        const categories = [...new Set(Object.values(commands).map(c => c.category))].filter(cat =>
            cat && cat.trim() !== '' && cat !== 'undefined'
        );

        const categorized = {};
        categories.forEach(cat => {
            const categoryCommands = Object.values(commands).filter(c => c.category === cat);
            const validCommands = categoryCommands.filter(cmd => cmd.pattern && cmd.pattern.trim() !== '');
            if (validCommands.length > 0) {
                categorized[cat] = validCommands;
            }
        });

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
        const OWNER_NAME = userConfig?.OWNER_NAME || config.OWNER_NAME || "Owner";
        const PREFIX = userConfig?.PREFIX || config.PREFIX || ".";
        const MODE = userConfig?.MODE || config.MODE || "private";
        const VERSION = userConfig?.VERSION || config.VERSION || "1.0.0";
        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";

        let menuSections = '';
        for (const [category, cmds] of Object.entries(categorized)) {
            if (cmds && cmds.length > 0) {
                const section = formatCategory(category, cmds, PREFIX);
                if (section !== '') {
                    menuSections += section;
                }
            }
        }

        let dec = `*╭─═━━━ 🌟 ${BOT_NAME.toUpperCase()} 🌟 ━━━═─╮*
│
*│ 👤 ${toSmallCaps('Owner')}: ${OWNER_NAME}*
*│ ⚙️ ${toSmallCaps('Prefix')}: ${PREFIX}*
*│ ⏱️ ${toSmallCaps('Uptime')}: ${runtime(process.uptime())}*
*│ 📊 ${toSmallCaps('Commands')}: ${totalCommands}*
*│ 🛡️ ${toSmallCaps('Mode')}: ${MODE}*
*│ 🏷️ ${toSmallCaps('Version')}: ${VERSION}*
│
*╰─═━━━━━━━━━━━━━━═─╯*
${menuSections}

> ${DESCRIPTION || ''}`;

        const defaultMenuImage = 'https://i.ibb.co/Zp9NrwPR/8ff3c4f8edcf.jpg';
        let imageToUse = defaultMenuImage;

        if (isValidImageUrl(userConfig?.BOT_IMAGE)) {
            try {
                await axios.head(userConfig.BOT_IMAGE, { timeout: 3000 });
                imageToUse = userConfig.BOT_IMAGE;
            } catch (urlError) {
                console.log('BOT_IMAGE URL not reachable, using default menu image:', urlError.message);
                imageToUse = defaultMenuImage;
            }
        }

        const newsletterContext = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: NEWSLETTER_JID,
                newsletterName: BOT_NAME,
                serverMessageId: 143
            }
        };

        let sent = false;
        try {
            await conn.sendMessage(from, {
                image: { url: imageToUse },
                caption: dec,
                contextInfo: newsletterContext
            }, { quoted: mek });
            sent = true;
        } catch (imageError) {
            console.log('Error sending menu image with contextInfo, trying without contextInfo:', imageError.message);
            try {
                await conn.sendMessage(from, {
                    image: { url: imageToUse },
                    caption: dec
                }, { quoted: mek });
                sent = true;
            } catch (fallbackImageError) {
                console.log('Error sending menu image entirely, falling back to text message:', fallbackImageError.message);
            }
        }

        if (!sent) {
            try {
                await conn.sendMessage(from, {
                    text: dec,
                    contextInfo: newsletterContext
                }, { quoted: mek });
            } catch (textError) {
                console.log('Error sending text menu with contextInfo, sending plain text:', textError.message);
                await conn.sendMessage(from, { text: dec }, { quoted: mek });
            }
        }

        try {
            const audioPath = getRandomAudio();
            if (audioPath) {
                const input = fs.readFileSync(audioPath);
                const ptt = await converter.toPTT(input, 'mp3');
                await conn.sendMessage(from, {
                    audio: ptt,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                }, { quoted: mek });
            } else {
                console.error('No mp3 found in data/menu-voice');
            }
        } catch (audioError) {
            console.log('Audio send error:', audioError);
        }

    } catch (e) {
        console.log(e);
        reply(`Error: ${e}`);
    }
});
