const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  let fileContent = '';

  // Define your keywords here
  const keywords = [
    "Calculating electric field from continuous charge distributions",
    "Using different coordinate systems based on symmetry",
    "Analyzing charge distributions into point charges",
    "Integrating electric fields from point charges",
    "Checking physical sense of calculated electric fields",
    "Infinite charged wire electric field",
    "Infinite charged plane electric field"
  ];

  for (let keyword of keywords) {
    const page = await browser.newPage();
    fileContent += `Search Results for: ${keyword}\n\n`;

    // Google Search
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
    await page.goto(googleSearchUrl, { waitUntil: 'networkidle2' });
    const googleSearchResult = await page.evaluate(() => {
      const item = document.querySelector('a h3');
      if (item) {
        const parentElement = item.parentElement;
        if (parentElement && parentElement.href) {
          return {
            title: item.innerText,
            url: parentElement.href
          };
        }
      }
      return null;
    });

    if (googleSearchResult) {
      fileContent += "Google Search Result:\n";
      fileContent += `Title: ${googleSearchResult.title}\n   URL: ${googleSearchResult.url}\n\n`;
    }

    // YouTube Search
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`;
    await page.goto(youtubeSearchUrl, { waitUntil: 'networkidle2' });
    const youtubeSearchResult = await page.evaluate(() => {
      const item = document.querySelector('a#video-title');
      if (item) {
        const title = item.title;
        const url = 'https://www.youtube.com' + item.getAttribute('href');
        return { title, url };
      }
      return null;
    });

    if (youtubeSearchResult) {
      fileContent += "YouTube Video Result:\n";
      fileContent += `Title: ${youtubeSearchResult.title}\n   URL: ${youtubeSearchResult.url}\n\n`;
    }

    await page.close(); // Close the current page before moving to the next keyword
  }

  // Save to a file
  const fileName = 'searchResults.txt';
  fs.writeFile(fileName, fileContent, (err) => {
    if (err) {
      console.error('An error occurred while writing the file:', err);
    } else {
      console.log(`Search results were successfully saved to ${fileName}`);
    }
  });

  await browser.close();
})();
