'use strict';
const fs  = require('fs');
const fse = require('fs-extra');
const path = require('path');

async function useMongoDBAuthState(collection, number) {
    const sessionDir = path.join(process.cwd(), `session_${number}`);
    await fse.ensureDir(sessionDir);

    const credsPath = path.join(sessionDir, 'creds.json');

    if (!fs.existsSync(credsPath)) {
        try {
            const doc = await collection.findOne({ _id: `creds_${number}` });
            if (doc?.creds) await fse.outputFile(credsPath, doc.creds);
        } catch (_) {}
    }

    const bail = require('@whiskeysockets/baileys');
    const useMultiFileAuthState = bail.useMultiFileAuthState;

    if (typeof useMultiFileAuthState !== 'function') {
        return {
            state: {
                creds: {},
                keys: { get: async () => ({}), set: async () => {} },
            },
            saveCreds: async () => {},
        };
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const saveCredsMongo = async () => {
        await saveCreds();
        try {
            const raw = await fse.readFile(credsPath, 'utf8');
            await collection.updateOne(
                { _id: `creds_${number}` },
                { $set: { creds: raw, updatedAt: Date.now() } },
                { upsert: true }
            );
        } catch (_) {}
    };

    return { state, saveCreds: saveCredsMongo };
}

module.exports = { useMongoDBAuthState };