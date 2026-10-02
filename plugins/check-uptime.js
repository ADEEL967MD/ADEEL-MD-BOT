const { cmd } = require('../command');

const FOOTER = `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ ⚡*`;

const contextInfo = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: '120363403380688821@newsletter',
    newsletterName: "𝐀𝐃𝐄𝐄𝐋-𝐌𝐃",
    serverMessageId: Date.now()
  }
};

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  let timeString = '';
  if (days > 0) timeString += `${days} day${days > 1 ? 's' : ''} `;
  if (hours > 0) timeString += `${hours} hour${hours > 1 ? 's' : ''} `;
  if (minutes > 0) timeString += `${minutes} minute${minutes > 1 ? 's' : ''} `;
  if (secs > 0 || timeString === '') timeString += `${secs} second${secs !== 1 ? 's' : ''}`;

  return timeString.trim();
};

cmd({
  pattern: "uptime",
  alias: ["runtime", "up"],
  desc: "Check bot uptime",
  category: "utility",
  react: "🕷",
  filename: __filename
},
async (conn, mek, m, { from, reply }) => {
  try {
    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const uptime = formatUptime(process.uptime());

    const msg =
`*╭─═ ⚡ UPTIME ═─╮*
*│ 🕰️ Uptime:* \`${uptime}\`
*│ 🟢 Status:* Online
*│ 🍸 Mode:* \`Active & Stable\`
*╰─═━━━━━━━━━━━═─╯*

${FOOTER}`;

    await conn.sendMessage(from, {
      text: msg,
      contextInfo: {
        ...contextInfo,
        mentionedJid: [m.sender]
      }
    }, { quoted: mek });

    await new Promise(resolve => setTimeout(resolve, 800));
    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

  } catch (e) {
    console.error("Error in uptime command:", e);
    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    await reply(`❌ Error checking uptime: ${e.message}`);
  }
});
