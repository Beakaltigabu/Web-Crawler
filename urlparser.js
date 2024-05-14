const url = require('url');

const crawledURLs = new Set();

function parseURL(urlString) {
  const urlRegex = /^(https?:\/\/)?([^\s.]+(\.[^\s]+)?)(\/[^\s]*)?$/;
  if (urlRegex.test(urlString)) {
    let protocol = 'https:';
    let hostname = '';
    let path = '';

    // Extract hostname and path from URL string
    const urlParts = urlString.match(/^https?:\/\/([^\/]+)(.*)$/);
    if (urlParts) {
      hostname = urlParts[1];
      path = urlParts[2] || '/';
    } else {
      // URL doesn't start with http:// or https://, assume https://
      const noProtocolUrlParts = urlString.match(/^([^\/]+)(.*)$/);
      if (noProtocolUrlParts) {
        hostname = noProtocolUrlParts[1];
        path = noProtocolUrlParts[2] || '/';
      } else {
        throw new Error(`Invalid URL format: "${urlString}"`);
      }
    }

    // Normalize the URL to the format 'https://www.example.com/path'
    const normalizedURL = `${protocol}//${hostname}${path}`;

    return {
      protocol,
      hostname,
      path,
      normalizedURL
    };
  } else {
    throw new Error(`Invalid URL format: "${urlString}"`);
  }
}


function isExternalLink(urlString, baseURL) {
  const parsedURL = parseURL(urlString);
  const parsedBaseURL = parseURL(baseURL);

  // Check if the hostname is different from the base URL
  if (parsedURL.hostname !== parsedBaseURL.hostname) {
    return true; // External link
  }

  // Check if the URL has a relative path
  if (!parsedURL.hostname && parsedURL.path.startsWith('/')) {
    return false; // Internal link with relative path
  }

  // Check if the URL points to a file type you want to exclude
  const excludedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
  const fileExtension = parsedURL.path.split('.').pop().toLowerCase();
  if (excludedFileTypes.includes(`.${fileExtension}`)) {
    return true; // Excluded file type
  }

  return false; // Internal link and allowed file type
}

function addCrawledURL(urlString) {
  crawledURLs.add(urlString);
}

function isAlreadyCrawled(urlString) {
  return crawledURLs.has(urlString);
}

module.exports = {
  parseURL,
  isExternalLink,
  addCrawledURL,
  isAlreadyCrawled
};
