require('./settings')
const { modul } = require('./module');
const { baileys, boom, chalk, fs, figlet, FileType, path, pino, process, PhoneNumber, axios, yargs, _ } = modul;
const { Boom } = boom
const {
    default: makeWASocket,
    DisconnectReason,
    makeInMemoryStore,
    useMultiFileAuthState,
    delay,
    fetchLatestBaileysVersion,
    jidDecode,
    makeCacheableSignalKeyStore,
    proto
} = require("@whiskeysockets/baileys")

const { smsg, color } = require('./lib/myfunc')
const pino_logger = pino({ level: 'silent' })
const store = makeInMemoryStore({ logger: pino_logger.child({ level: 'silent', stream: 'store' }) })
const readline = require("readline")
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function startDiszx() {
    const { state, saveCreds } = await useMultiFileAuthState(`./${sessionName}`)
    const { version } = await fetchLatestBaileysVersion()

    const diszx = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, 
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        version
    })

    // --- Pairing Code System ---
    if (!diszx.authState.creds.registered) {
        const phoneNumber = await question(color('\n\nMasukan nomor WhatsApp Bot kamu (Contoh: 628xxx):\n', 'magenta'));
        const code = await diszx.requestPairingCode(phoneNumber.trim());
        console.log(color(`\nKODE PAIRING DISZX BOT:`, 'green'), color(`${code}`, 'white', 'bold'));
    }

    store.bind(diszx.ev)

    diszx.ev.on('messages.upsert', async chatUpdate => {
        try {
            const kay = chatUpdate.messages[0]
            if (!kay.message) return
            if (kay.key.fromMe) return
            const m = smsg(diszx, kay, store)
            
            // Memanggil fitur utama dari diszxe.js
            require('./diszxe')(diszx, m, chatUpdate, store)
        } catch (err) {
            console.log(err)
        }
    })

    diszx.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode
            if (reason !== DisconnectReason.loggedOut) {
                startDiszx() // Auto Reconnect
            }
        } else if (connection === 'open') {
            console.log(color('\n[ ONLINE ] Diszx Bot Berhasil Terhubung!', 'green'))
        }
    })

    diszx.ev.on('creds.update', saveCreds)

    diszx.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    return diszx
}

startDiszx()

