const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const urlparser = require('./urlparser');
const { checkRobotsTxt, handle404Error } = require('./utils');

let shouldContinueCrawling = true; // Global flag to control crawling

function crawlURL(url) {
  if (!shouldContinueCrawling) return; // Check if crawling should continue

  request(url, (error, response, body) => {
    if (error) {
      console.error(`Error crawling ${url}: ${error}`);
      return;
    }

    if (response.statusCode === 404) {
      handle404Error(url);
      return;
    }

    // Check if the content is in the Amharic language
    const amharicText = extractAmharicContent(body);
    if (amharicText) {
      saveExtractedText(amharicText, url);
    }

    const $ = cheerio.load(body);
    const internalLinks = crawlInternalLinks($, url);
    const paginationLinks = handlePagination($);
    const dynamicContentLinks = handleDynamicContent($);

    const linksToVisit = [...internalLinks, ...paginationLinks, ...dynamicContentLinks];

    linksToVisit.forEach(link => {
      if (!urlparser.isAlreadyCrawled(link) && !urlparser.isExternalLink(link, url) && checkRobotsTxt(link)) {
        urlparser.addCrawledURL(link);
        crawlURL(link);
      }
    });
  });
}

// ... (rest of the code remains the same)


function extractAmharicContent(html) {
  const $ = cheerio.load(html);
  const textContent = $('body').text();
  const amharicRegex = /[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF]+/g;
  const amharicMatches = textContent.match(amharicRegex);

  if (amharicMatches && amharicMatches.length > 0) {
    return amharicMatches.join(' ').trim();
  }

  return null;
}

function handlePagination($) {
  const paginationLinks = [];

  // Find all links with text "Next" or "Previous"
  $('a').each((index, link) => {
    const text = $(link).text().trim().toLowerCase();
    const href = $(link).attr('href');

    if ((text === 'next' || text === 'previous') && href) {
      paginationLinks.push(href);
    }
  });

  return paginationLinks;
}


function handleDynamicContent($) {
  const dynamicContentLinks = [];

  // Find all "Load More" links
  $('a').each((index, link) => {
    const text = $(link).text().trim().toLowerCase();
    const href = $(link).attr('href');

    if (text === 'load more' && href) {
      dynamicContentLinks.push(href);
    }
  });

  return dynamicContentLinks;
}

function crawlInternalLinks($, baseURL) {
  const internalLinks = [];
  const baseURLObj = new URL(baseURL);

  $('a').each((index, link) => {
    const href = $(link).attr('href');
    if (href) {
      try {
        // Skip fragments (URLs starting with #)
        if (href.startsWith('#')) {
          return;
        }

        // Skip JavaScript links
        if (href.startsWith('javascript:')) {
          return;
        }

        // Skip mailto links
        if (href.startsWith('mailto:')) {
          return;
        }

        const linkURL = new URL(href, baseURL);
        const normalizedLink = urlparser.parseURL(linkURL.href).normalizedURL;
        if (linkURL.hostname === baseURLObj.hostname || !urlparser.isExternalLink(href, baseURL)) {
          internalLinks.push(normalizedLink);
        }
      } catch (err) {
        // Handle invalid URLs or URLs that cannot be parsed
        console.warn(`Invalid URL: ${href}`);
      }
    }
  });

  return internalLinks;
}




function startCrawling(url) {
  const normalizedURL = urlparser.parseURL(url).normalizedURL;
  urlparser.addCrawledURL(normalizedURL);
  crawlURL(normalizedURL);
}

function saveExtractedText(text, url) {
  const data = `URL: ${url}\n${text}\n\n`;
  fs.appendFileSync('extractedText.txt', data);
}

module.exports = {
  startCrawling
};
