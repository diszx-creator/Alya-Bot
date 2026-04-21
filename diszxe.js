module.exports = async (sock, msg, setting) => {
    try {
        const from = msg.key.remoteJid
        const body =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            ""

        const command = body.toLowerCase()

        if (command === "ping") {
            await sock.sendMessage(from, { text: "pong 🏓" }, { quoted: msg })
        }

        if (command === "menu") {
            await sock.sendMessage(
                from,
                {
                    text: `*${setting.botName}*
Owner: ${setting.ownerName}

*MENU*
- ping
- menu

${setting.footer}`
                },
                { quoted: msg }
            )
        }
    } catch (err) {
        console.log(err)
    }
}
