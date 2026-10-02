const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "sim",
    alias: ["simdata", "database", "simdetail", "detailsim"],
    desc: "Get SIM owner details",
    category: "tools",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isOwner }) => {
    try {
        if (!isOwner) {
            return reply("*❌ Only the owner can use this command!*");
        }

        let input = q ? q.trim() : "";

        if (!input) {
            return reply("❌ Please provide a phone number!\nExample: .sim 03001234567");
        }

        let number = input.replace(/\D/g, '');

        if (number.length < 10) {
            return reply("❌ Invalid phone number format.");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const api = `https://adeel-xtech-apis.vercel.app/api/sim-database?search=${encodeURIComponent(number)}`;

        const res = await axios.get(api, {
            timeout: 30000,
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json"
            }
        });

        const data = res.data;

        if (!data || !data.status || !Array.isArray(data.result) || data.result.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ No records found for this number.");
        }

        const record = data.result[0];

        const responseText = 
`╭━━〔  *SIM DATA* 〕━━⬣\n\n` +
`┃ *✦ ɴᴀᴍᴇ* : ${record.name || "Unknown"}\n` +
`┃ *✦ ɴᴜᴍʙᴇʀ* : ${record.mobile || input}\n` +
`┃ *✦ ᴄɴɪᴄ* : ${record.cnic || "Not Found"}\n` +
`┃ *✦ ɴᴇᴛᴡᴏʀᴋ* : ${record.network || "Not Found"}\n` +
`┃ *✦ ʟᴏᴄᴀᴛɪᴏɴ* : ${record.address || "Not Found"}\n\n` +
`╰━━━━━━━━━━━━⬣\n\n` +
`> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ ⚡*`;

        await conn.sendMessage(from, { text: responseText }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("SIM Database Error:", err.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ API connection failed. Please try again later.");
    }
});
