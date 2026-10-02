const config = require('../config');
const { cmd } = require('../command');
const { sleep } = require('../lib/functions');

cmd({
    pattern: "accept",
    alias: ["acceptall"],
    desc: "Accept group join requests",
    category: "group",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { from, body, args, isGroup, isAdmins, isOwner, isCreator, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command only works in groups.");

        if (!isOwner && !isCreator && !isAdmins) {
            return reply("❌ Access Denied! Only group admins can use this command.");
        }

        const text = (body || '').trim().toLowerCase();
        const prefix = (config.PREFIX || '.').toLowerCase();

        if (
            text === `${prefix}accept` ||
            text === ".accept"
        ) {
            return reply(
`╭━━〔 ACCEPT MENU 〕━━⬣
┃
┃ ◈ .acceptall
┃ ➜ Accept all pending requests
┃
┃ ◈ .accept 15
┃ ➜ Accept only 15 requests
┃
╰━━━━━━━━━━━━━━⬣`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const pending = await conn.groupRequestParticipantsList(from);

        if (!pending || pending.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ No pending join requests found.");
        }

        const metadata = await conn.groupMetadata(from);
        const availableSlots = 1024 - metadata.participants.length;

        let limit;

        if (
            text.startsWith(`${prefix}acceptall`) ||
            text.startsWith(".acceptall") ||
            (args[0] && args[0].toLowerCase() === "all")
        ) {
            limit = pending.length;
        } else {
            limit = parseInt(args[0]);
            if (isNaN(limit) || limit <= 0) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply("❌ Please provide a valid number.");
            }
        }

        const toAccept = pending.slice(0, Math.min(limit, availableSlots));

        if (toAccept.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Group is full or no requests to process.");
        }

        let approved = 0;

        for (const user of toAccept) {
            try {
                const jid = user.jid || user.id;
                await conn.groupRequestParticipantsUpdate(from, [jid], "approve");
                approved++;
                await sleep(2000);
            } catch (err) {
                await sleep(3000);
            }
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        return reply(`✅ Successfully approved ${approved} join requests.`);

    } catch (e) {
        console.log("ACCEPT ERROR:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Failed to accept join requests.");
    }
});

cmd({
    pattern: "rejectall",
    alias: ["reject"],
    desc: "Reject all group join requests",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, isCreator, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command only works in groups.");

        if (!isOwner && !isCreator && !isAdmins) {
            return reply("❌ Access Denied! Only group admins can use this command.");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const pending = await conn.groupRequestParticipantsList(from);

        if (!pending || pending.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ No pending join requests found.");
        }

        let rejected = 0;

        for (const user of pending) {
            try {
                const jid = user.jid || user.id || user.lid;
                await conn.groupRequestParticipantsUpdate(from, [jid], "reject");
                rejected++;
                await sleep(2000);
            } catch (err) {
                try {
                    if (user.lid) {
                        await conn.groupRequestParticipantsUpdate(from, [user.lid], "reject");
                        rejected++;
                    }
                } catch (e) {}
                await sleep(3000);
            }
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        return reply(`✅ Done! Rejected ${rejected} join request(s).`);

    } catch (e) {
        console.log("REJECT ERROR:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Failed to reject join requests.");
    }
});
