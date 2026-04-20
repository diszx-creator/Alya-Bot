require('./settings');
const { getContentType } = require('@whiskeysockets/baileys');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const crypto = require('crypto');

// Database Setup
const dbPath = './Database/users.json';
if (!fs.existsSync('./Database')) fs.mkdirSync('./Database');
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));

module.exports = async (sock, m, chatUpdate) => {
    try {
        const type = getContentType(m.message);
        const from = m.key.remoteJid;
        const body = (type === 'conversation') ? m.message.conversation : 
                     (type === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                     (type === 'imageMessage') ? m.message.imageMessage.caption : 
                     (type === 'videoMessage') ? m.message.videoMessage.caption : '';
        
        const isCmd = body.startsWith(global.prefix);
        const command = isCmd ? body.slice(global.prefix.length).trim().split(' ')[0].toLowerCase() : "";
        const args = body.trim().split(/ +/).slice(1);
        const query = args.join(" ");
        const pushname = m.pushName || "User";

        const sender = m.key.participant || m.key.remoteJid;
        const senderNumber = sender.split('@')[0];
        
        let database = JSON.parse(fs.readFileSync(dbPath));
        const isOwner = global.owner.includes(senderNumber);
        const isRegistered = database.includes(senderNumber);
        const userStatus = isOwner ? "Developer" : (global.premium.includes(senderNumber) ? "Premium" : "Free User");

        if (isCmd) {
            // Filter Registrasi
            if (!isRegistered && !['daftar', 'menu'].includes(command)) {
                return sock.sendMessage(from, { 
                    image: { url: global.imageMenu },
                    caption: `╭━━━━ 「 ⚠️ *ACCESS DENIED* 」\n┃\n┃ Halo *${pushname}* ✨\n┃ Kamu belum terdaftar.\n┃\n┃ *Daftar dulu yuk:* \n┃ 👉 Ketik: *${global.prefix}daftar*\n┃\n╰━━━━━━━━━━━━━━━━━━━━━`
                }, { quoted: m });
            }

            switch (command) {
                case 'menu': {
                    // Reaksi Jam
                    await sock.sendMessage(from, { react: { text: "⌚", key: m.key } });

                    const runtime = (s) => {
                        var d = Math.floor(s / (3600*24)), h = Math.floor(s % (3600*24) / 3600), m = Math.floor(s % 3600 / 60), s = Math.floor(s % 60);
                        return `${d}d ${h}h ${m}m ${s}s`;
                    }
                    const wib = new Date(new Date().getTime() + 7 * 3600 * 1000).toTimeString().split(' ')[0];

                    await sock.sendMessage(from, { audio: { url: global.audioMenu }, mimetype: 'audio/mp4', ptt: true }, { quoted: m });
                    await sock.sendMessage(from, { video: { url: global.gifMenu }, caption: `*${global.botname} Active!*`, gifPlayback: true });

                    const menuText = `✨───「 *All Menu* 」───✨\n\n ➤ *Nama Bot* : ${global.botname}\n ➤ *Creator* : ${global.ownername}\n ➤ *User* : ${pushname}\n ➤ *Status* : ${userStatus}\n ➤ *Runtime* : ${runtime(process.uptime())}\n ➤ *Time* : ${wib} WIB\n\n┌  ───「 *USER MENU* 」───\n│ ◦ .daftar\n│ ◦ .ai [tanya]\n│ ◦ .menu\n└──────────────\n\n_Powered by Dicki Setyawan_ 🌸`;

                    await sock.sendMessage(from, { image: { url: global.imageMenu }, caption: menuText }, { quoted: m });
                    
                    // Reaksi Ombak
                    await sock.sendMessage(from, { react: { text: "🌊", key: m.key } });
                }
                break;

                case 'daftar': {
                    if (isRegistered) return m.reply('Kamu sudah terdaftar, Dick!');
                    
                    const localBgPath = './library/daftar.jpg';
                    if (!fs.existsSync(localBgPath)) return m.reply('File daftar.jpg tidak ditemukan di folder library!');

                    await sock.sendMessage(from, { text: "_Memproses sertifikat Alya.chan..._" }, { quoted: m });

                    const userCode = "ALYA-" + crypto.randomBytes(3).toString('hex').toUpperCase();
                    const canvas = createCanvas(1000, 560);
                    const ctx = canvas.getContext('2d');

                    const background = await loadImage(fs.readFileSync(localBgPath));
                    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

                    ctx.fillStyle = '#0d2a54'; 
                    ctx.font = 'bold 25px Arial';
                    const posX = 570, startY = 222, spacing = 47; 

                    ctx.fillText(`:  ${pushname.slice(0, 20)}`, posX, startY);
                    ctx.fillText(`:  ${userStatus}`, posX, startY + spacing);
                    ctx.fillText(`:  ${userCode}`, posX, startY + (spacing * 2));
                    ctx.fillText(`:  ${new Date().toLocaleDateString('id-ID')}`, posX, startY + (spacing * 3));

                    const buffer = canvas.toBuffer('image/png');
                    database.push(senderNumber);
                    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));

                    await sock.sendMessage(from, { 
                        image: buffer, 
                        caption: `🎉 *REGISTRASI BERHASIL!*\n\nSertifikat pendaftaran kamu sudah terbit otomatis. Simpan baik-baik ya kak!` 
                    }, { quoted: m });
                }
                break;

                case 'ai': {
                    if (!query) return m.reply("Mau tanya apa ke Alya?");
                    m.reply("_Sedang memikirkan jawaban..._");
                }
                break;
            }
        }
    } catch (err) { console.log(err) }
};
