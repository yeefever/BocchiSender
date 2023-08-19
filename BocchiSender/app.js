const { Client, IntentsBitField, AttachmentBuilder, EmbedBuilder } = require("discord.js");
const axios = require('axios');
const cheerio = require('cheerio'); 
const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');
const config = require('./config_file.json');
const { Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

/*

URL encoding sometimes is messed up. Will look into.

TO-DO: 
    PIXIV: Maybe remove bad tags (manga, nsfw)

    REDDIT: 
        Reddit Scraping? IDK API at least might exist ._. 

    GENERAL STUFF:

        Random timing of messages throughout day. 

        Keep a backlog of stuff that's alr been seen ? (Shouldn't really matter) 

        Functionality of specify what you tag you want sent.
    
    */

const API_URL = "https://www.pixiv.net/en/tags/%E3%81%BC%E3%81%A3%E3%81%A1%E3%83%BB%E3%81%96%E3%83%BB%E3%82%8D%E3%81%A3%E3%81%8F!1000users%E5%85%A5%E3%82%8A/illustrations";
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
    if (message.content == "bocchi") {

        // save first 
        (async () => {
            //generate random page

            /* TO DO : Sometimes still weird navigation bugs. GO through 1 - 10
            
            */
            const page_num = Math.floor(Math.random() * 10) + 1;

            var URL = API_URL;
            if (page_num != 1) {
                URL += '?p=' + page_num;
            }


            var browser = await puppeteer.launch({
                headless: true,
                defaultViewport: null,
                args: ['--start-maximized']
            });
            var page = await browser.newPage();
            //copypasta 
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3');


            await page.goto(URL);
            html = await page.content();

            // Save HTML content to a local file
            await fs.writeFileSync('webpage.html', html);
            console.log("WRITTEN");

            await browser.close();

            const htmlFilePath = 'webpage.html';
            var html = fs.readFileSync(htmlFilePath, 'utf-8');
            const $ = cheerio.load(html);

            const liElements = $('li[class]');

            const artIds = [];

            //Parse page html 
            liElements.each((index, liElement) => {
                const illustElements = $(liElement).find('div[type="illust"]'); //usually just one ?
                illustElements.each((divIndex, illustElement) => {
                    const str = $(illustElement).html();
                    const match = str.match(/\/artworks\/(\d+)/);

                    if (match) {
                        const id = match[1];
                        artIds.push(id);
                    }
                });
            });

            var artId;
            //Pull a random artwork id
            if (artIds.length > 0) {
                const i = Math.floor(Math.random() * artIds.length);
                artId = artIds[i];
            } else {
                console.log('No artwork IDs found.');
                return;
            }

            //visit pixiv again : bs method to skip oauth

            browser = await puppeteer.launch({
                headless: true,
                defaultViewport: null,
                args: ['--start-maximized']
            });
            page = await browser.newPage();
            await page.setDefaultNavigationTimeout(0);
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3');

            const imageUrl = 'https://www.pixiv.net/en/artworks/' + artId;
            console.log(imageUrl);
            await page.goto(imageUrl);

            await page.waitForTimeout(4000); //loading time

            const buttonCSS = '#root > div.charcoal-token > div > div:nth-child(4) > div > div > div.sc-1nr368f-3.dkdRNk > main > section > div.sc-171jvz-0.gcrJTU > div > div.sc-rsntqo-0.fPeueM > div > div > button';
            const showAllButton = await page.$(buttonCSS);

            if (showAllButton) {
                console.log("BUTTON FOUND!");
                await showAllButton.click();
                console.log("BUTTON_CLICKED!");
            }
            else {
                console.log("BRUH NO BUTTON");
            }

            /* CAN THROW IN FUNCTIONALITY TO GET random image for things with more than 1 image.

            */

            await page.waitForTimeout(500); //chill after button hit

            /* TO DO: FIX NAMING HERE

            */

            const imageCSS = 'img[src^="https://i.pximg.net/img"]';
            var image = await page.$(imageCSS);

            if (image) {
                const imageHTML = await page.evaluate(element => element.outerHTML, image);
                console.log(imageHTML);
            }

            const artistCSS = '#root > div.charcoal-token > div > div:nth-child(4) > div > div > div.sc-1nr368f-3.dkdRNk > main > section > div.sc-1yvhotl-0.vkWNg > div > div > div.sc-10gpz4q-3.btGTaP > h2 > div > div > a > div';
            var artist = await page.$(artistCSS);
            var artist_name;

            if (artist) {
                const artistHtml = await page.evaluate(element => element.outerHTML, artist);
                const regex = /<div>(.*?)<\/div>/;
                const match = regex.exec(artistHtml);

                if (match) {
                    artist_name = match[1];
                    console.log(artist_name);
                }
            }

            if (image) {
                await image.screenshot({ path: 'screen_shot.png' });

            } else {
                console.log('Image not found.');
                //happens when image is nsfw. Kinda a good thing. Cuz u gotta login
            }

            await browser.close();

            /* create an embed with the image and associated info
 
            Probably a better way to pass this info but that remains to be seen. 
            */

            const file = new AttachmentBuilder('screen_shot.png');
            const exampleEmbed = new EmbedBuilder()
                .setTitle("TODO: ADD TITLES")
                .setImage('attachment://screen_shot.png')
                .setDescription("Artist: " + artist_name + "\n Pixiv Illust ID: " + artId);
            await message.channel.send({ embeds: [exampleEmbed], files: [file] });

        })();
    }


    //don't think this works

   /* if (message.content == 'download') {
        (async function () {
            // Initialize the WebDriver
            const options = new chrome.Options()
                .addArguments('--disable-web-security')
                .addArguments('--allow-running-insecure-content')
                .addArguments('--ignore-certificate-errors');

            const driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build(); 

            try {
                const url = 'https://www.pixiv.net/en/artworks/69460448';
                try {
                    driver.get(url);
                    await driver.wait(until.elementLocated(By.tagName('body')), 10000);
                } catch (error) {
                    console.error('SUS:', error);
                }
                const imageElements = await driver.findElements(By.tagName('img'));
                const targetPattern = "https://i.pximg.net/img-master/";

                for (const element of imageElements) {
                    const src = await element.getAttribute('src');
                    if (src.startsWith(targetPattern)) {
                        const actions = driver.actions({ bridge: true });
                        await actions.contextClick(element).perform();
                        await driver.sleep(1000);
                        await actions.keyDown(Key.SHIFT).sendKeys('V').keyUp(Key.SHIFT).perform();
                        await driver.sleep(5000);
                    }
                }
            } finally {
                await driver.quit();
            }
        })();
    }*/
});

client.login(config.token);