const argv = require('minimist')(process.argv.slice(2));
const conversion = require('phantom-html-to-pdf')();

import phantom from 'phantom';
import fs from 'fs';
import chalk from 'chalk';
let _ph;
let _page;

const {
  url,
  file,
  verbose = false,
  fitToPage = false
} = argv;

if (!url || !file) {
  console.log(chalk.red('Some of the arguments are missing.'));
  console.log(chalk.red('Usage: simple-html-to-pdf --url="http://www.somewebsite.com" --file="/tmp/my.pdf" [--verbose] [--fitToPage]'));
  console.log(chalk.red('Exiting...'));
  console.log('\n');
  process.exit(0);
}

let conversionOptions = { fitToPage };

function myConsole(message, verbose = false) {
  if (verbose) {
    return console.log(message);
  }
}

phantom.create().then((ph) => {
  _ph = ph;
  return _ph.createPage();
}).then((page) => {
  _page = page;
  return _page.open(url);
}).then((status) => {
  myConsole(status, verbose);
  return _page.property('content');
}).then((content) => {
  myConsole(content, verbose);
  _page.close();
  _ph.exit();

  conversionOptions = { ...conversionOptions, html: content };

  conversion(conversionOptions, function(err, pdf) {
    myConsole(pdf.logs, verbose);
    myConsole(pdf.numberOfPages, verbose);
    pdf.stream.pipe(fs.createWriteStream(file));

    conversion.kill();

    console.log(chalk.bold.cyan('Conversion success!'));
  });
}).catch((error) => {
  console.error(chalk.red('Conversion failed...'));
  console.error(chalk.red(error));
});
