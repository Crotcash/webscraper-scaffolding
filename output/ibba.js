import puppeteer from 'puppeteer';
import fs from 'fs';

async function scrapeIBBA() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const baseUrl = 'https://www.ibba.org/find-a-business-broker/';

  await page.goto(baseUrl, { waitUntil: 'networkidle2' });

  await page.waitForSelector('.broker-card');

  // Auto-scroll to load all results
  await autoScroll(page);

  const brokers = await page.$$eval('.broker-card', cards => {
    return cards.map(card => {
      const firmName = card.querySelector('.broker-card__firm')?.textContent?.trim() || 'N/A';
      const contactName = card.querySelector('.broker-card__name')?.textContent?.trim() || 'N/A';
      const email = card.querySelector('a[href^="mailto:"]')?.getAttribute('href')?.replace('mailto:', '') || 'N/A';

      return { firmName, contactName, email };
    });
  });

  console.log(`Found ${brokers.length} brokers`);
  fs.writeFileSync('output/ibba_brokers.json', JSON.stringify(brokers, null, 2));
  console.log('Data saved to output/ibba_brokers.json');

  await browser.close();
}

// Scroll helper
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Call it
scrapeIBBA();
