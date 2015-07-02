node-ajax-snapshot
==================

Nodejs wrapper of [phantomjs-ajax-snapshot](https://github.com/ericzon/phantomjs-ajax-snapshot), generates static pages from ajax / non-ajax source pages and allows stripping of DOM elements identifying them by id, class, name or meta-property (only for meta tags).

## Installation

  npm install node-ajax-snapshot --save

## Usage

  Options:

    (sourceFile | sourceUrl)

    -sourceFile    (string) file with json array format, containing the set of urls to generate.

    -sourceUrl    (string) single url to visit.

    -basePath    (string) common basepath among urls.

    -separator    (string) separator to replace '/' in file names ([---] by default).

    -waitingTime    (miliseconds) Use specified waiting time to load javascript of every page (3000 by default).

    -outputDir    (string) place to write the output files (snapshots/ by default).

    -idlist    (Array) elements id to strip in html (empty by default).

    -classlist    (Array) elements class to strip in html (empty by default).

    -metalist    (Array) elements metaname to strip in html (empty by default).

    -debug    (boolean) Enables debug messages (false by default).

## Examples

```javascript

  var nodeAjaxSnapshot = require('node-ajax-snapshot');

```

  Minimal config:

```javascript

    var nasStream = nap.takeSnapshots({
          sourceFile: 'urlFile.json'            // file with json array format, containing the set of urls to generate.
        });

    or with an url directly:

    var nasStream = nap.takeSnapshots({
          sourceUrl: 'www.ajax-example.com/basepath/'           // url to generate.
        });
```

  Normal config:

```javascript

    var nasStream = nodeAjaxSnapshot.takeSnapshots({
          basePath: 'www.ajax-example.com/app/',
          sourceFile: 'urlFile.json',           // file with json array format, containing the set of urls to generate.
          separator: '[---]',
          waitingTime: 2000,                    // waiting time between urls. 3000 miliseconds by default
          outputDir: path.join(__dirname, 'NodeAjaxSnapshot', 'snapshots'+path.sep),
          filters: {
            idlist: [],
            classlist: [],
            metalist: []
          },
          debug: false                          // false by default
        });

    nasStream.stdout.on('data', function (data) {
        console.log(data.toString());
    });

    nasStream.stderr.on('data', function (data) {
        console.log(data.toString());
    });

    nasStream.on('close', function (code) {
        console.log('nasStream child process exited with code ['+ code+']');
    });

```  

## Tests

  npm test (not yet)

## Dependencies

  [Phantomjs](http://phantomjs.org/ "Phantomjs' Homepage") headless webkit with JS API + [phantomjs](https://www.npmjs.com/package/phantomjs) wrapper for node + [phantomjs-ajax-snapshot](https://github.com/ericzon/phantomjs-ajax-snapshot).

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

## Author

[Eric Lara](https://www.twitter.com/EricLaraAmat), supported by [Ondho](http://www.ondho.com).

## License

  MIT

## Changelog

* 0.0.3 Added phantom's parameter to avoid errors.
  0.0.2 Added better docs.
  0.0.1 Initial commit

## Roadmap

* connect with [node-ajax-seo](https://github.com/ericzon/node-ajax-seo) (WIP).
* generate images from pages (WIP).

