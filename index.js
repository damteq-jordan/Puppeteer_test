// Puppeteer
import puppeteer from 'puppeteer';
// Dotenv
import 'dotenv/config';
// Slack Integration
import Slack from '@slack/bolt';
// SQL DB
import mysql from 'mysql2';

// DB Connection
var con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DB
});

// Slack Connection
const app = new Slack.App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN
});

// DB Query
con.connect(function(err) {
    if (err) throw err;
    con.query("SELECT Client_Name, Client_Url FROM damteq_clients", async function (err, results, fields) {
        if (err) throw err;
        const entries = results.map(row => row.Client_Url);

        // Commented out 10-min interval to mimic running a cron on the file.
        // let interval = 10 * 60 * 1000;
        // setInterval(async () => {
        await runPuppeteer(entries);
        // }, interval);
    });
});

//DB INSERT INTO
// con.connect(function(err) {
//     if (err) throw err;
//     var sql = "INSERT INTO damteq_clients (Client_Name, Client_Url) VALUES ?";
//     var values = [
//       ['sitename', 'siteurl']
//     ];
//     con.query(sql, [values], function (err, result) {
//       if (err) throw err;
//       console.log("Number of records inserted: " + result.affectedRows);
//     });
//   });

// Function to run Puppeteer loop
async function runPuppeteer(entries) {
    const browser = await puppeteer.launch();
    for (let url of entries) {
        const page = await browser.newPage();
        try {
            const response = await page.goto(url, { waitUntil: 'load', timeout: 0 });
            const status = response.status();
            if (status >= 400) {
                await app.client.chat.postMessage({
                    token: process.env.SLACK_BOT_TOKEN,
                    channel: process.env.SLACK_BOT_CHANNEL,
                    text: `:x: Outage Detected: ${url} has encountered a ${status} error.`, // Add <!channel> to mention channel
                });
            }
        } catch (error) {
            console.error(`Error: Could not navigate to ${url} - ${error.message}`);
            await browser.close();
            process.exit(1);
        } finally {
            await page.close();
        }
    }
    await browser.close();
}
