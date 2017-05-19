const argv = require('minimist')(process.argv.slice(2));
const conversion = require('phantom-html-to-pdf')();

import phantom from 'node-phantom-async';
import fs from 'fs';
import chalk from 'chalk';
import Promise from 'promise';

const {
  url,
  file,
  verbose = false,
  fitToPage = false,
  phantomDelay = 200,
  printDelay,
} = argv;

if (!url || !file) {
  console.log(chalk.red('Some of the arguments are missing.'));
  console.log(chalk.red('Usage: simple-html-to-pdf --url="http://www.somewebsite.com" --file="/tmp/my.pdf" [--verbose] [--fitToPage] [--phantomDelay] [--printDelay]'));
  console.log(chalk.red('Exiting...'));
  console.log('\n');
  process.exit(0);
}

let conversionOptions = { fitToPage, printDelay };

function myConsole(message, verbose = false) {
  if (verbose) {
    return console.log(message);
  }
}

let self = {};

phantom.create()
.bind({})
.then((ph) => {
  self.ph = ph;
  return ph.createPage();
})
.then((page) => {
  self.page = page;
  return page.open(url);
})
.then((status) => {
  myConsole(status, verbose);
  console.log(chalk.bold.cyan(`Going to wait ${phantomDelay} milliseconds...`));
  return self.page.get('content');
})
.delay(phantomDelay) // Wait for AJAX content to load on the page.
.then((content) => {
  myConsole(content, verbose);

  conversionOptions = { ...conversionOptions, html: content };

  return new Promise((resolve, reject) => {
    conversion(conversionOptions, function(err, pdf) {
      if (err) {
        console.log(chalk.red(err));
        conversion.kill();
        return reject(err);
      }

      myConsole(pdf.logs, verbose);
      myConsole(pdf.numberOfPages, verbose);
      let stream = pdf.stream.pipe(fs.createWriteStream(file));
      stream.on('finish', () =>{
        conversion.kill();
        console.log(chalk.bold.cyan('Conversion success!'));
        resolve();
      });

      stream.on('error', (error) => {
        console.error(chalk.red('Failed to write a file...'));
        console.error(chalk.red(error));
        conversion.kill();

        reject(error);
      });
    });
  });
})
.catch((error) => {
  console.error(chalk.red('Conversion failed...'));
  console.error(chalk.red(error));
})
.finally(function() {
    console.log(chalk.bold.cyan('Going to close Phantom'));
    return self.ph.exit();
})
.finally(function() {
    console.log(chalk.bold.cyan('Going to exit the process'));
    process.exit();
});
