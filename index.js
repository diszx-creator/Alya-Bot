const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const pino = require("pino")
const { Boom } = require("@hapi/boom")
const diszxe = require("./diszxe")
const setting = require("./setting")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(setting.sessionName)

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update

        if (connection === "close") {
            const shouldReconnect =
                (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut

            if (shouldReconnect) {
                startBot()
            } else {
                console.log("Bot logout")
            }
        } else if (connection === "open") {
            console.log(`Bot ${setting.botName} terhubung`)
        }
    })

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return

        await diszxe(sock, msg, setting)
    })
}

startBot()
