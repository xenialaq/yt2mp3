const fastify = require('fastify');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const chance = require('chance').Chance();
const winston = require('winston');
const retry = require('promise-retry');

fs.ensureDirSync('./temp');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: './logs/combined.log' }),
  ],
});

const cache = { urlToHash: {}, metadata: {} };

let isConversionOngoing = false;

const app = fastify();

app.post('/queue', async (req) => {
  const { url } = req.body;

  await retry((r) => new Promise((resolve, reject) => {
    logger.log({
      level: 'info',
      message: `isConversionOngoing ${isConversionOngoing}`,
    });
    if (isConversionOngoing) reject(new Error('Conversion is Ongoing'));
    resolve();
  }).catch(r));
  isConversionOngoing = true;

  if (cache.urlToHash[url]) {
    return cache.urlToHash[url];
  }

  const hash = chance.hash();
  const filename = `${hash}.mp3`;
  const metaname = `${filename}.info.json`;
  const args = [
    url,
    '--write-info-json',
    '--extract-audio',
    '--audio-format',
    'mp3',
    '-o',
    path.join('./temp', filename),
  ];
  const youtubedl = spawn('youtube-dl', args);

  youtubedl.stdout.on('data', (data) => {
    logger.log({
      level: 'info',
      message: data.toString(),
    });
  });

  youtubedl.on('close', (code) => {
    logger.log({
      level: 'info',
      message: `youtube-dl process close all stdio with code ${code}`,
    });
  });

  return new Promise((resolve) => {
    youtubedl.on('exit', (code) => {
      logger.log({
        level: 'info',
        message: `youtube-dl process exited with code ${code}`,
      });
      const metadata = JSON.parse(fs.readFileSync(path.join('./temp', metaname)));
      cache.urlToHash[url] = hash;
      cache.metadata[hash] = metadata;
      isConversionOngoing = false;
      resolve(hash);
    });
  });
});

app.get('/download/:hash', async (req) => {
  const hash = req.params.hash.toLowerCase();
  if (!hash.match(/^[0-9a-f]{40}$/)) {
    const err = new Error();
    err.statusCode = 400;
    err.message = 'Bad request';
    throw err;
  }
  if (!cache.metadata[hash]) {
    const err = new Error();
    err.statusCode = 404;
    err.message = 'File not found';
    throw err;
  }
  return fs.readFileSync(path.join('./temp', `${req.params.hash}.mp3`));
});


app.listen(3000).then(() => {
  logger.log({
    level: 'info',
    message: 'Server running at http://localhost:3000/',
  });
});
