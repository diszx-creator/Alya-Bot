require('./settings');
const { 
    makeWASocket, useMultiFileAuthState, DisconnectReason, 
    fetchLatestBaileysVersion, makeCacheableSignalKeyStore 
} = require("@whiskeysockets/baileys");
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const readline = require("readline");

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(text, (answer) => { rl.close(); resolve(answer) }));
};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_alya');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        printQRInTerminal: false,
        version,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        let phoneNumber = global.botNumber.replace(/[^0-9]/g, '');
        if (!phoneNumber) phoneNumber = await question('Masukkan nomor bot (628xxx): ');
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(`\n\x1b[42m KODE PAIRING ANDA: \x1b[0m \x1b[1m\x1b[32m${code}\x1b[0m\n`);
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m || !m.message) return;
            require('./diszxe')(sock, m, chatUpdate);
        } catch (err) { console.log(err) }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if ((lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut) startBot();
        } else if (connection === 'open') {
            console.log(`\n\x1b[32m[ ONLINE ] ${global.botname} Berhasil Terhubung!\x1b[0m\n`);
        }
    });
}
startBot();
