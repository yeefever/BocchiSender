const { Client, IntentsBitField } = require("discord.js");
const axios = require('axios');
const cheerio = require('cheerio'); 
const fs = require('fs');
const puppeteer = require('puppeteer');
const config = require('./config_file.json');

/*

URL encoding sometimes is messed up. Will look into.

TO-DO: 
    PIXIV:
        Get random page. Get random position (x illust/page).

        Pull illust ID. Pass through ugoira or smt.

        Send channel Message.

    REDDIT: 
        Reddit Scraping? IDK API at least might exist ._. 

    GENERAL STUFF:

        Random timing of messages throughout day. 

        Keep a backlog of stuff that's alr been seen ? (Shouldn't really matter) 

        Functionality of specify what you tag you want sent.
    
    */

const API_URL = "https://www.pixiv.net/en/tags/%E3%81%BC%E3%81%A3%E3%81%A1%E3%81%A1%E3%82%83%E3%82%93/artworks?s_mode=s_tag";
//const API_URL = 'https://www.pixiv.net/en/tags/leagueoflegends';
//const API_URL = "https://leagueoflegends.fandom.com/wiki/Gromp";

//init client 
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});

client.on("ready", () => {
    console.log("Bot ready...");
});


/* 
    Axios got blocked by Pixiv scraping prevention.
*/

//event handler
/*client.on("messageCreate", (message) => {
    if (message.content.startsWith("test")) {

        axios.get(API_URL)
            .then(response => {
                const html = response.data;

                const filePath = 'response.html';

                // Write the response data to the file
                fs.writeFile(filePath, html, 'utf-8', (err) => {
                    if (err) {
                        console.error('errpr:', err);
                    } else {
                        console.log('Written');
                    }
                });
            })
            .catch(error => {
                    console.log(error.message);
                });
            });

        
    }
});*/

/* try actually connecting into the webpage */

client.on("messageCreate", (message) => {
    if (message.content == "test") {

        (async () => {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            //copypasta 
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3');

            await page.goto(API_URL);
            const html = await page.content();

            // Save HTML content to a local file
            fs.writeFileSync('webpage.html', html);

            /*
            TO DO Parse tmrw. 

            Get the random id here. Page is above.
            
            Prob have to travel to the actual illust page and get author/credit info for later.
            */

            await browser.close();
        })();

        /* create an embed with the image and associated info 
        
            Probably a better way to pass this info but that remains to be seen. 
        */

        const embed = new MessageEmbed()
            .setColor('#ffc5db')        //bocchi color
            .setTitle('Image title')
            .setDescription('Author, Description, link, tags, etc.')
            .setImage('some url'); 

        await message.channel.send({embeds:[embed]});

    }
});

client.login(config.token);