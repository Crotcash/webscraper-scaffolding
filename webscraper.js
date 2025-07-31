import puppeteer from "puppeteer";
import fs from "fs/promises";
import { JSDOM } from "jsdom";

/*
Code is clean and easy to follow with clear separation of concerns.. that awesome there...
Good use of error handling with try catch
recommendations:
  > add a method to verify that the url is valid currently you just verifying that it is is valid string. Fix: use new URL()
  > Extracted href and src may be relative as you can see from you output some links are not complete. Fix: Resolve relative links against the base URL
  > add try/finally to scrape() and close the browser on the finally just in case
  > the output file over writes the available file, if this is intentional it's fine but consider creating new files instead incase user still requires scraped info from different files.

overall your scraper is well designed and easy to understand. cheers
*/

class WebScraper {
  constructor(url) {
    this.url = url;
    this.links = new Set();
    this.images = new Set();
  }

  async launchBrowser() {
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();
    console.log("Starting web scrapper...");
  }

  async fetchPage() {
    try {
      await this.page.goto(this.url, { waitUntil: "networkidle2" });
      this.html = await this.page.content();
      console.log("Page fetched successfully.");
    } catch (error) {
      console.error("Failed to fetch page:", error);
    }
  }

  extractLinksAndImages() {
    const dom = new JSDOM(this.html);
    const { document } = dom.window;

    // Extract links
    const anchorTags = document.querySelectorAll("a[href]");
    anchorTags.forEach((a) => {
      const href = a.getAttribute("href");
      if (href && !href.startsWith("#")) {
        this.links.add(href);
      }
    });

    // Extract images
    const imgTags = document.querySelectorAll("img[src]");
    imgTags.forEach((img) => {
      const src = img.getAttribute("src");
      if (src) {
        this.images.add(src);
      }
    });

    console.log(`Found ${this.links.size} unique links.`);
    console.log(`Found ${this.images.size} unique images.`);
  }

  async saveToFile() {
    try {
      await fs.writeFile("links.txt", Array.from(this.links).join("\n"));
      await fs.writeFile("images.txt", Array.from(this.images).join("\n"));
      console.log("Data saved to links.txt and images.txt");
    } catch (error) {
      console.error("Failed to save files:", error);
    }
  }

  async closeBrowser() {
    await this.browser.close();
    console.log("Browser closed.");
  }

  async scrape() {
    await this.launchBrowser();
    await this.fetchPage();
    this.extractLinksAndImages();
    await this.saveToFile();
    await this.closeBrowser();
  }
}

// Entry point
const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: node webscraper.js <URL>");
  process.exit(1);
}

const url = args[0];
const scraper = new WebScraper(url);
scraper.scrape();
