'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _nodePhantomAsync = require('node-phantom-async');

var _nodePhantomAsync2 = _interopRequireDefault(_nodePhantomAsync);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _promise = require('promise');

var _promise2 = _interopRequireDefault(_promise);

var argv = require('minimist')(process.argv.slice(2));
var conversion = require('phantom-html-to-pdf')();

var url = argv.url;
var file = argv.file;
var _argv$verbose = argv.verbose;
var verbose = _argv$verbose === undefined ? false : _argv$verbose;
var _argv$fitToPage = argv.fitToPage;
var fitToPage = _argv$fitToPage === undefined ? false : _argv$fitToPage;
var _argv$phantomDelay = argv.phantomDelay;
var phantomDelay = _argv$phantomDelay === undefined ? 200 : _argv$phantomDelay;
var printDelay = argv.printDelay;

if (!url || !file) {
  console.log(_chalk2['default'].red('Some of the arguments are missing.'));
  console.log(_chalk2['default'].red('Usage: simple-html-to-pdf --url="http://www.somewebsite.com" --file="/tmp/my.pdf" [--verbose] [--fitToPage] [--phantomDelay] [--printDelay]'));
  console.log(_chalk2['default'].red('Exiting...'));
  console.log('\n');
  process.exit(0);
}

var conversionOptions = { fitToPage: fitToPage, printDelay: printDelay };

function myConsole(message) {
  var verbose = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

  if (verbose) {
    return console.log(message);
  }
}

var self = {};

_nodePhantomAsync2['default'].create().bind({}).then(function (ph) {
  self.ph = ph;
  return ph.createPage();
}).then(function (page) {
  self.page = page;
  return page.open(url);
}).then(function (status) {
  myConsole(status, verbose);
  console.log(_chalk2['default'].bold.cyan('Going to wait ' + phantomDelay + ' milliseconds...'));
  return new _promise2['default'](function (resolve, reject) {
    setTimeout(function () {
      console.log(_chalk2['default'].bold.cyan('Wait finished.'));
      self.page.get('content').then(resolve)['catch'](reject);
    }, phantomDelay);
  });
}).then(function (content) {
  myConsole(content, verbose);

  conversionOptions = _extends({}, conversionOptions, { html: content });

  return new _promise2['default'](function (resolve, reject) {
    conversion(conversionOptions, function (err, pdf) {
      if (err) {
        console.log(_chalk2['default'].red(err));
        conversion.kill();
        return reject(err);
      }

      myConsole(pdf.logs, verbose);
      myConsole(pdf.numberOfPages, verbose);
      var stream = pdf.stream.pipe(_fs2['default'].createWriteStream(file));
      stream.on('finish', function () {
        conversion.kill();
        console.log(_chalk2['default'].bold.cyan('Conversion success!'));
        resolve();
      });

      stream.on('error', function (error) {
        console.error(_chalk2['default'].red('Failed to write a file...'));
        console.error(_chalk2['default'].red(error));
        conversion.kill();

        reject(error);
      });
    });
  });
})['catch'](function (error) {
  console.error(_chalk2['default'].red('Conversion failed...'));
  console.error(_chalk2['default'].red(error));
})['finally'](function () {
  console.log(_chalk2['default'].bold.cyan('Going to close Phantom'));
  return self.ph.exit();
})['finally'](function () {
  console.log(_chalk2['default'].bold.cyan('Going to exit the process'));
  process.exit();
});