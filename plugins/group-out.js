const { cmd } = require('../command');

function normalizeNumber(id) {
    if (!id) return '';
    return String(id)
        .split('@')[0]
        .split(':')[0]
        .replace(/[^0-9]/g, '');
}

function collectNumbers(p) {
    const ids = [p.id, p.jid, p.lid, p.phoneNumber, p.participant].filter(Boolean);
    const nums = [];
    for (const id of ids) {
        const n = normalizeNumber(id);
        if (n && !nums.includes(n)) nums.push(n);
    }
    return nums;
}

function collectJids(p) {
    const list = [p.jid, p.id, p.lid, p.phoneNumber].filter(Boolean);
    const out = [];
    for (const j of list) {
        const s = String(j);
        if (!out.includes(s)) out.push(s);
    }
    return out;
}

cmd({
    pattern: "out",
    alias: ["🚪", "🦶"],
    desc: "Remove group members by country code",
    category: "group",
    react: "⚪",
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, reply, isCreator, isOwner, sender, isBotAdmins, isAdmins }) => {
    try {
        if (!isGroup) return reply("❌ Group only.");

        if (!isOwner && !isCreator) {
            return reply("❌ Only owner can use this command!");
        }

        if (isBotAdmins === false) {
            return reply("❌ Bot must be admin.");
        }

        const code = args[0] ? String(args[0]).trim().replace(/[^0-9]/g, '') : '';
        if (!code || !/^\d{1,4}$/.test(code)) {
            return reply("⚠️ Usage: .out 92\nExample: .out 91 | .out 1 | .out 971");
        }

        let metadata;
        try {
            metadata = await conn.groupMetadata(from);
        } catch (e) {
            return reply("❌ Failed to load group metadata.");
        }

        const participants = metadata.participants || [];
        const botNumber = normalizeNumber(conn.user?.id || conn.user?.jid || '');
        const ownerNumber = normalizeNumber(sender);

        const toRemove = participants.filter(p => {
            const numbers = collectNumbers(p);
            if (!numbers.length) return false;
            if (botNumber && numbers.some(n => n === botNumber)) return false;
            if (ownerNumber && numbers.some(n => n === ownerNumber)) return false;
            if (p.admin === 'admin' || p.admin === 'superadmin') return false;
            return numbers.some(n => n.startsWith(code));
        });

        if (toRemove.length === 0) {
            return reply(`❌ No members found with country code *${code}*`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } }).catch(() => {});

        let success = 0;
        let failed = 0;

        for (const user of toRemove) {
            const tryIds = collectJids(user);
            let removed = false;
            for (const jid of tryIds) {
                try {
                    await conn.groupParticipantsUpdate(from, [jid], "remove");
                    removed = true;
                    success++;
                    break;
                } catch (_) {}
            }
            if (!removed) failed++;
            await new Promise(r => setTimeout(r, 800));
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } }).catch(() => {});

        return reply(
            `✅ *OUT DONE*\n\n` +
            `Country: *${code}*\n` +
            `Removed: *${success}*\n` +
            (failed ? `Failed: *${failed}*\n` : '') +
            `Total matched: *${toRemove.length}*`
        );
    } catch (e) {
        console.log("OUT ERROR:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }).catch(() => {});
        return reply("❌ Error: " + (e.message || e));
    }
});
