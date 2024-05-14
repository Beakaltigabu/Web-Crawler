const readline = require('readline');
const urlparser = require('./urlparser');
const crawler = require('./crawler');
const { checkRobotsTxt } = require('./utils');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the URL to crawl: ', (url) => {
  try {
    const parsedURL = urlparser.parseURL(url);
    const normalizedURL = parsedURL.normalizedURL;

    if (urlparser.isExternalLink(normalizedURL, normalizedURL)) {
      console.log('URL is an external link or points to an excluded file type.');
      rl.close();
      return;
    }

    if (!checkRobotsTxt(normalizedURL)) {
      console.log('URL not allowed according to robots.txt.');
      rl.close();
      return;
    }

    crawler.startCrawling(normalizedURL);
    rl.close();
  } catch (err) {
    console.error(err.message);
    rl.close();
  }
});
