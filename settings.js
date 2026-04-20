const fs = require('fs');

global.owner = ['6285199611293']; // Nomor Owner (Dicki)
global.premium = ['628xxxxxxxxxx']; 
global.botNumber = '628xxxxxxxxxx'; // Nomor yang jadi Bot

global.botname = 'Alya.chan'; 
global.ownername = 'Dicki Setyawan';
global.prefix = '.';

// Media Menu (Ganti link dengan media milikmu)
global.imageMenu = 'https://raw.githubusercontent.com/yuusuke1101/Yuugames/refs/heads/main/IMG-20251228-WA0077.jpg'; 
global.gifMenu = 'https://files.catbox.moe/wd237u.mp4'; 
global.audioMenu = 'https://files.catbox.moe/blmznn.mp3';

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(`Update ${__filename}`);
    delete require.cache[file];
    require(file);
});
