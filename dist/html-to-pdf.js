'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _phantom = require('phantom');

var _phantom2 = _interopRequireDefault(_phantom);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var argv = require('minimist')(process.argv.slice(2));
var conversion = require('phantom-html-to-pdf')();

var _ph = undefined;
var _page = undefined;

var url = argv.url;
var file = argv.file;
var _argv$verbose = argv.verbose;
var verbose = _argv$verbose === undefined ? false : _argv$verbose;
var _argv$fitToPage = argv.fitToPage;
var fitToPage = _argv$fitToPage === undefined ? false : _argv$fitToPage;

if (!url || !file) {
  console.log(_chalk2['default'].red('Some of the arguments are missing.'));
  console.log(_chalk2['default'].red('Usage: simple-html-to-pdf --url="http://www.somewebsite.com" --file="/tmp/my.pdf" [--verbose] [--fitToPage]'));
  console.log(_chalk2['default'].red('Exiting...'));
  console.log('\n');
  process.exit(0);
}

var conversionOptions = { fitToPage: fitToPage };

function myConsole(message) {
  var verbose = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

  if (verbose) {
    return console.log(message);
  }
}

_phantom2['default'].create().then(function (ph) {
  _ph = ph;
  return _ph.createPage();
}).then(function (page) {
  _page = page;
  return _page.open(url);
}).then(function (status) {
  myConsole(status, verbose);
  return _page.property('content');
}).then(function (content) {
  myConsole(content, verbose);
  _page.close();
  _ph.exit();

  conversionOptions = _extends({}, conversionOptions, { html: content });

  conversion(conversionOptions, function (err, pdf) {
    myConsole(pdf.logs, verbose);
    myConsole(pdf.numberOfPages, verbose);
    pdf.stream.pipe(_fs2['default'].createWriteStream(file));

    conversion.kill();

    console.log(_chalk2['default'].bold.cyan('Conversion success!'));
  });
})['catch'](function (error) {
  console.error(_chalk2['default'].red('Conversion failed...'));
  console.error(_chalk2['default'].red(error));
});