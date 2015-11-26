var path = require('path');
var childProcess = require('child_process');

var phantomjs = require('phantomjs');
var binPath = phantomjs.path;

exports.takeSnapshots= function(config) {
    console.log("Running node-ajax-snapshot. Config: ", config);

    // merging defaults with custom config
    var childArgsAjaxSnapshot = [
        '--ssl-protocol=any',
        '--disk-cache=no',
        path.join(__dirname, 'phantomjs-script', 'phantomjsAjaxSnapshot.js'),
        '-t',
        config.waitingTime || '3000', // miliseconds
        '-basepath',
        config.basePath || '',
        '-useragent',
        config.userAgent || 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/53 (KHTML, like Gecko) Chrome/15.0.87',
        '-outputdir',
        config.outputDir || path.join(__dirname, '..', '..','..', 'NodeAjaxSnapshot', 'snapshots' + path.sep),  // node_modules level
        '-separator',
        config.separator || '[---]',
        '-format',
        config.outputFormat || 'html',
        ((config.debug) ? '-debug' : '')
    ];

    if(config.sourceUrl){
        childArgsAjaxSnapshot.push("-sourceurl");
        childArgsAjaxSnapshot.push(config.sourceUrl);
    }else{
        childArgsAjaxSnapshot.push("-sourcefile");
        childArgsAjaxSnapshot.push(config.sourceFile);
    }

    if(config.filters != undefined){
    	var filterKeys = Object.keys(config.filters);
        filterKeys.forEach(function(filterKey){
		    if(config.filters[filterKey] != undefined){
                childArgsAjaxSnapshot.push("-"+filterKey);
                childArgsAjaxSnapshot.push(config.filters[filterKey].join(","));
		    }
    	});
    }

    //console.log("childArgsAjaxSnapshot: ",childArgsAjaxSnapshot);
    console.log("binPath: ",binPath);

    return childProcess.spawn(binPath, childArgsAjaxSnapshot);
};
