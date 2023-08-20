const cron = require('node-cron');
const { exec } = require('child_process');

const randomTimes = generateRandomTimes();

randomTimes.forEach(time => {
    cron.schedule(time, () => {
        console.log(`Run at ${new Date().toLocaleString()}`);

        exec('node pixiv_scrape.js', (error, stdout, stderr) => {
            if (error) {
                console.error(`${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`${stderr}`);
                return;
            }
            console.log(`${stdout}`);
        });
    });
});


function generateRandomTimes() {
    const times = []
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);

    times.push(`${now.getMinutes()} ${now.getHours()} * * *`);
    return times;
}

/*function generateRandomTimes() {
    const times = [];
    for (let i = 0; i < 2; i++) {
        const h = Math.floor(Math.random() * 24);
        const m = Math.floor(Math.random() * 60);
        times.push(`${m} ${h} * * *`);
    }
    return times;
}*/