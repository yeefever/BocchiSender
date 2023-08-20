const client = require('./app');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const config = require('./config_file.json');
const fs = require('fs');
const { Client, IntentsBitField, AttachmentBuilder, EmbedBuilder } = require("discord.js");


async function scrapeRandomPixiv(userId, frequency, bad_art) {
  //generate random page

  /* TO DO : Sometimes still weird navigation bugs. GO through 1 - 10
          
  */

  const API_URL = "https://www.pixiv.net/en/tags/%E3%81%BC%E3%81%A3%E3%81%A1%E3%83%BB%E3%81%96%E3%83%BB%E3%82%8D%E3%81%A3%E3%81%8F!1000users%E5%85%A5%E3%82%8A/illustrations";

  const page_num = Math.floor(Math.random() * 50) + 1;

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

  await page.goto('https://accounts.pixiv.net/login?return_to=https%3A%2F%2Fwww.pixiv.net%2Fen%2F&lang=en&source=pc&view_type=page'); //login to pixiv


  await page.waitForTimeout(4000); //loading

  // login

  const usernameSelector = '#app-mount-point > div > div > div > div.sc-2oz7me-0.fJsfdC > div.sc-fg9pwe-2.gZSHsw > div > div > div > form > fieldset.sc-bn9ph6-0.kJkgq.sc-2o1uwj-2.dNokDr > label > input';
  const passwordSelector = '#app-mount-point > div > div > div > div.sc-2oz7me-0.fJsfdC > div.sc-fg9pwe-2.gZSHsw > div > div > div > form > fieldset.sc-bn9ph6-0.kJkgq.sc-2o1uwj-3.iA-DYnj > label > input';
  const loginSelector = '#app-mount-point > div > div > div > div.sc-2oz7me-0.fJsfdC > div.sc-fg9pwe-2.gZSHsw > div > div > div > form > button';


  await page.waitForSelector(usernameSelector);
  const usernamebox = await page.$(usernameSelector);
  await usernamebox.type(config.pixiv_user);

  await page.waitForSelector(passwordSelector);
  const passwordbox = await page.$(passwordSelector);
  await passwordbox.type(config.pixiv_password);

  await page.waitForSelector(loginSelector);
  const loginButton = await page.$(loginSelector);
  await loginButton.click();

  await page.waitForTimeout(4000); //logint o process 

  await page.goto(URL);
  await page.waitForTimeout(5000); //5 seconds
  html = await page.content();

  // Save HTML content to a local file
  await fs.writeFileSync('webpage.html', html);
  console.log("WRITTEN");

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
  const imageUrl = 'https://www.pixiv.net/en/artworks/' + artId;

  console.log(imageUrl);
  await page.goto(imageUrl);
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

  const titleCSS = '#root > div.charcoal-token > div > div:nth-child(4) > div > div > div.sc-1nr368f-3.dkdRNk > main > section > div.sc-171jvz-0.gcrJTU > div > figcaption > div > div > h1';
  var title = await page.$(titleCSS)
  var titleExtract = null;
  if (title) {
    titleExtract = await page.evaluate(element => element.outerHTML, title);

    //extract title element.
    const $ = cheerio.load(titleExtract)
    titleExtract = $('h1').text();
  }
  else {
    console.log("title not found");
    titleExtract = "Unnamed";
  }


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
    .setTitle(titleExtract)
    .setImage('attachment://screen_shot.png')
    .setDescription(`Artist: ${artist_name}\n Pixiv Illust ID: ${artId}\n [link](${imageUrl})`);

  client.users.fetch(userId)
    .then(user => {
      // Send a DM to the user

      user.send({ embeds: [exampleEmbed], files: [file] })
        .then(() => console.log(`Sent DM to user with ID ${user.id}`))
        .catch(error => console.error('Error sending DM:', error));
    })
    .catch(error => console.error('Error fetching user:', error));
};

//read users
const fPath = `registered_users`;

fs.readdir('registered_users', (err, files) => {
  if (err) {
    console.error('Erorr:', err);
    return;
  }

  files.forEach(file => {
    const filetoRead = `${fPath}/${file}`;

    fs.readFile(filetoRead, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error:`, err);
        return;
      }

      try {
        const userData = JSON.parse(data);
        scrapeRandomPixiv(userData.userId, userData.frequency.value, userData.low_quality.value);
      } catch (parseError) {
        console.error(`JSON error ${file}:`, parseError);
      }

    });
  });
});