const { cmd } = require("../command");
const { File } = require("megajs");
const fs = require("fs");
const path = require("path");
const os = require("os");
const config = require("../config");

const FOOTER = config.DESCRIPTION || "";

cmd({
    pattern: "megadl",
    alias: ["mega", "meganz"],
    react: "📦",
    desc: "Download ZIP or any file from Mega.nz",
    category: "download",
    use: ".megadl <mega file link>",
    filename: __filename
},
async (conn, mek, m, { from, q }) => {
    try {
        if (!q) {
            await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
            return await conn.sendMessage(from, { text: "⚠️ Usage: .megadl <mega file link>" }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const file = File.fromURL(q);
        await file.loadAttributes();

        const data = await new Promise((resolve, reject) => {
            file.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        const fileName = file.name || "mega_file.zip";
        const savePath = path.join(os.tmpdir(), fileName);

        fs.writeFileSync(savePath, data);

        await conn.sendMessage(from, {
            document: fs.readFileSync(savePath),
            fileName: fileName,
            mimetype: "application/zip",
            caption: FOOTER
        }, { quoted: mek });

        if (fs.existsSync(savePath)) {
            fs.unlinkSync(savePath);
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Mega Downloader Error:", error.message);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        await conn.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: mek });
    }
});
