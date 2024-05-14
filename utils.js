const fs = require('fs');
const http = require('http');
const https = require('https');

function checkRobotsTxt(urlString) {
  const parsedURL = require('./urlparser').parseURL(urlString);
  const robotsURL = `${parsedURL.protocol}//${parsedURL.hostname}/robots.txt`;

  return new Promise((resolve, reject) => {
    const protocol = parsedURL.protocol === 'https:' ? https : http;

    protocol.get(robotsURL, (res) => {
      let robotsContent = '';

      res.on('data', (chunk) => {
        robotsContent += chunk;
      });

      res.on('end', () => {
        const disallowedPaths = parseRobotsContent(robotsContent);
        const isAllowed = !disallowedPaths.some((path) => urlString.includes(path));
        resolve(isAllowed);
      });
    }).on('error', (err) => {
      // Handle error if robots.txt is not found or cannot be read
      resolve(true); // Assume allowed if robots.txt is not available
    });
  });
}


function parseRobotsContent(robotsContent) {
  const disallowedPaths = [];
  const lines = robotsContent.split('\n');

  let userAgent = '';
  for (const line of lines) {
    if (line.startsWith('User-agent:')) {
      userAgent = line.split(':')[1].trim();
      if (userAgent === '*' || userAgent.toLowerCase() === 'user-agent') {
        userAgent = '';
      }
    } else if (line.startsWith('Disallow:') && !userAgent) {
      const path = line.split(':')[1].trim();
      disallowedPaths.push(path);
    }
  }

  return disallowedPaths;
}

function handle404Error(urlString) {
  const url = new URL(urlString);

  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'HEAD'
  };

  const req = https.request(options, (res) => {
    if (res.statusCode === 404) {
      console.log(`404 Error: ${urlString}`);
    } else {
      console.log(`Status Code: ${res.statusCode}`);
    }
  });

  req.on('error', (err) => {
    console.error(`Error: ${err.message}`);
  });

  req.end();
}

module.exports = {
  checkRobotsTxt,
  handle404Error
};
