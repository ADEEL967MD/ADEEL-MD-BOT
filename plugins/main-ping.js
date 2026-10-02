const { cmd } = require('../command');

const FOOTER = `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ ⚡*`;

const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];

const contextInfo = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: '120363403380688821@newsletter',
    newsletterName: "𝐀𝐃𝐄𝐄𝐋-𝐌𝐃",
    serverMessageId: Date.now()
  }
};

async function measureMs(conn, from, mek) {
  const emoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
  const start = Date.now();
  await conn.sendMessage(from, {
    react: { text: emoji, key: mek.key }
  });
  return Date.now() - start;
}

cmd({
    pattern: "ping",
    alias: ["speed", "pong"],
    desc: "Check bot's response time",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const ms = await measureMs(conn, from, mek);

        await conn.sendMessage(from, {
            text: `*𝘼𝘿𝙀𝙀𝙇-𝙈𝘿 ${ms}ms 💨*`,
            contextInfo: {
                ...contextInfo,
                mentionedJid: sender ? [sender] : undefined
            }
        });

    } catch (e) {
        console.error("Error in ping command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

cmd({
    pattern: "ping2",
    desc: "Check bot's response time",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const ms = await measureMs(conn, from, mek);

        let status;
        if (ms < 100) status = "🚀 *Blazing Fast*";
        else if (ms < 500) status = "⚡ *Fast & Responsive*";
        else status = "🐢 *Slow Response*";

        const msg =
`*╭─═⚡ ADEEL-MD SPEED ━━═─╮*
*│ 📶 Latency:* \`${ms} ms\`
*│ 🧠 Status:* ${status}
*│ 💫 Mode:* \`Active & Stable\`
*│ 🛡️ Security:* \`Secured\`
*╰─═━━━━━━━━━━━━━━═─╯*

${FOOTER}`;

        await conn.sendMessage(from, {
            text: msg.trim(),
            contextInfo
        });

    } catch (e) {
        console.error("Error in ping2 command:", e);
        reply(`⚠️ Error: ${e.message}`);
    }
});