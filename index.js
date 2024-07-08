// Puppeteer
import puppeteer from 'puppeteer';
const site = 'https://kinetecuk.com/letmein';

// lOCALHOST setup
import http from "http";
const port = 8080;

const server = http.createServer((req, res) => {
    res.write('test');
    res.end();
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
});

// Launch the browser and open a new blank page
const browser = await puppeteer.launch({
    headless: false, // Displays actions in viewport window
    defaultViewport: false, // Overrides default viewport to display window full size.
    userDataDir: './tmp',
});
const [page] = await browser.pages();
// Navigate the page to a URL.
await page.goto(site, {
    waitUntil: 'networkidle2',
});
// PAGE SPECIFIC STUFF //
// Login to Kinetec //
await page.locator('#user_login').fill('damteq');
await page.locator('#user_pass').fill('tg2CFdH9ACT)rGdp9QapC&qI');
await page.locator('#wp-submit').click();
await page.waitForNavigation();
// Listen for all responses
page.on('response', async (response) => {
    // Check if the status code is 500
    if (response.status() === 500) {
        console.error(`500 error detected: ${response.url()}`);
        await page.close();
    } else if (response.status() === 200) {
        console.log('Site loads as expected');
        await page.close();
    }
});