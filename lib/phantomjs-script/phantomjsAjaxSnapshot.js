/**
 *   Phantomjs Ajax Snapshot
 *   Author: @EricLaraAmat <ericzon@gmail.com>
 **/

var system = require('system');
var fs = require('fs');    
var RenderUrlsToFile;

function reverse_str(myString){
    myString = myString.split('').reverse().join('');
    return myString;
}

function trim(str) {
    return (str !== undefined) ? str.replace(/^\s+|\s+$/g,'') : '';
}

function parseArgs(){
    var args = system.args;
    var scriptOpts = [];
    console.log("Remember to put parameters JUST AFTER the command: 'phantomjs --ssl-protocol=any --disk-cache=no ... '\n");
    scriptOpts['-debug'] = '';
    //console.log("ARGS: ", args);
    if (args.length > 1) {
        var getNext = -1;
        var getValue = "";
        var currentOption = "";

        args.forEach(function(arg, i) {
            //console.log(i + ': ' + arg);

            var currentArg = arg.toLowerCase();
            if(/^\-/.test(currentArg)){
                currentOption = currentArg;
                if(currentOption === "-debug"){
                    scriptOpts[currentOption] = 'debug';
                }else{
                    scriptOpts[currentOption] = '';
                    getNext = i+1;
                }
            }

            if(i == getNext){
                scriptOpts[currentOption] = (/list/g.test(currentOption)) ? arg.split(',') : trim(arg); // trim spaces
                currentOption = '';
                getNext = -1; // reset value
            }
        });
    }

    return scriptOpts;
}

function readFile(input){
    var content = '',
    f = null,
    lines = null,
    eol = system.os.name == 'windows' ? "\r\n" : "\n";
    var output = '';

    try {
        f = fs.open(input, "r");
        content = f.read();
    } catch (e) {
        console.log(e);
    }

    if (f) {
        f.close();
    }

    if (content) {
        lines = content.split(eol);
        for (var i = 0, len = lines.length; i < len; i++) {
            console.log(lines[i]);
            output += lines[i];
        }
    }

    return output;
}


/*
Render fresh snapshots given urls with common basePath
@param array of URLs to render
@param scriptOpts bundle containing script parameters
@param callbackPerUrl Function called after finishing each URL, including the last URL
@param callbackFinal Function called after finishing everything
*/
RenderUrlsToFile = function(urls, scriptOpts, callbackPerUrl, callbackFinal) {
    var getFilename, next, page, retrieve, urlIndex, webpage;
    urlIndex = 0;
    webpage = require("webpage");
    page = null;
    scriptOpts['-basepath'] = scriptOpts['-basepath'].replace(/^http(s?)\:\/\//gi, '').replace(/\//g,'\\/');
    //console.log("basepath: ",basePath);
    var pattern = new RegExp(scriptOpts['-basepath'],"gi");

    getFilename = function(currentUrl) {
        var fileName = 'index';
        if(currentUrl != ''){
            // http://stackoverflow.com/questions/2593637/how-to-escape-regular-expression-in-javascript
            var separator = (scriptOpts['-separator']+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
            //console.log("Separator: ", separator);
            var separatorRegex = new RegExp("^"+separator+"+|"+separator+"+$","g");
            fileName = currentUrl.replace(/^http(s?)\:\/\//gi, '').
                                replace(pattern, '').
                                //replace(/\//g, scriptOpts['-separator']).
                                replace(/\//g, scriptOpts['-separator']).
                                replace(/\.html/g, '').
                                //replace(/^\[---\]+|\[---\]+$/g, '');
                                replace(separatorRegex, '');

        }

        fileName = ((fileName !== "") ? fileName : "index") + "." + scriptOpts['-format'];
        console.log("Filename output: ", fileName);

        return fileName;
    };

    next = function(status, url, file) {
        page.close();
        callbackPerUrl(status, url, file);
        return retrieve();
    };

    retrieve = function() {
        var url;
        if (urls.length > 0) {
            url = urls.shift();
            urlIndex++;
            page = webpage.create();

            if(scriptOpts['-format'] != 'html') {
                // http://phantomjs.org/api/webpage/property/paper-size.html
                page.paperSize = {
                    format: 'A4',
                    orientation: 'portrait',
                    margin: '1cm'
                };
            }

            page.onResourceRequested = function(requestData, request) {

                if(scriptOpts['-debug'] === 'debug'){
                    system.stderr.writeLine('= onResourceRequested()');
                    system.stderr.writeLine('  request: ' + JSON.stringify(request, undefined, 4));
                }
                if ((/http:\/\/.+?\.css/gi).test(requestData['url']) || requestData['Content-Type'] == 'text/css') {
                    if(scriptOpts['-debug'] === 'debug'){
                        console.log('The url of the request is matching. Aborting: ' + requestData['url']);
                    }
                    request.abort();
                }
            };


            // === DEBUGGING ERRORS ===          

            if(scriptOpts['-debug'] === 'debug'){

                page.onResourceReceived = function(response) {
                    system.stderr.writeLine('= onResourceReceived() id: ' + response.id + ', stage: "' + response.stage + '", response: ' + JSON.stringify(response));
                };
                 
                page.onLoadStarted = function() {
                    var currentUrl = page.evaluate(function() {
                        return window.location.href;
                    });
                    system.stderr.writeLine('= onLoadStarted() leaving url: ' + currentUrl);
                };
                 
                page.onLoadFinished = function(status) {
                    system.stderr.writeLine('= onLoadFinished() status: ' + status);
                };
                 
                page.onNavigationRequested = function(url, type, willNavigate, main) {
                    system.stderr.writeLine('= onNavigationRequested');
                    system.stderr.writeLine('  destination_url: ' + url);
                    system.stderr.writeLine('  type (cause): ' + type);
                    system.stderr.writeLine('  will navigate: ' + willNavigate);
                    system.stderr.writeLine('  from page\'s main frame: ' + main);
                };
                 
                page.onResourceError = function(resourceError) {
                    system.stderr.writeLine('= onResourceError()');
                    system.stderr.writeLine('  - unable to load url: "' + resourceError.url + '"');
                    system.stderr.writeLine('  - error code: ' + resourceError.errorCode + ', description: ' + resourceError.errorString );
                };
                 
                page.onError = function(msg, trace) {
                    system.stderr.writeLine('= onError()');
                    var msgStack = ['  ERROR: ' + msg];
                    if (trace) {
                        msgStack.push('  TRACE:');
                        trace.forEach(function(t) {
                            msgStack.push('    -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
                        });
                    }
                    system.stderr.writeLine(msgStack.join('\n'));
                };
            }

            // === ENDING DEBUGGING ERRORS ===
/*
            page.onResourceError = function(resourceError) {
                page.reason = resourceError.errorString;
                page.reason_url = resourceError.url;
            };
*/

            var pageSettings = {
                encoding: "utf8"
            };

            page.settings.userAgent = scriptOpts['-useragent'];
            //page.settings.encoding = "utf8";
            url = url.replace(/^http(s?):\/\//i,'');
            var urlTest = "http://" + url;
            console.log("\n\nTrying to test url: ",urlTest);

            return page.open(urlTest + '?seo=snapshot', pageSettings, function(status) {

                var file = getFilename(url);
                var output = scriptOpts['-outputdir']+file;

                if (status === "success") {
                    return window.setTimeout((function() {
                        var finalContent = page.content;
                        if(scriptOpts['-debug'] === 'debug'){
                            console.log("FINAL CONTENT: ", finalContent);
                        }

                        finalContent = page.evaluate(function (filtersById, filtersByClass, filtersByMetaTag) {

                            function replaceContentInContainer(matchClass, content) {
                                var elems = document.getElementsByTagName('*'), i;
                                for (i in elems) {
                                    if((' ' + elems[i].className + ' ').indexOf(' ' + matchClass + ' ') > -1) {
                                        //elems[i].innerHTML = content;
                                        if(content === ''){
                                            elems[i].parentNode.removeChild(elems[i]);
                                        }else{
                                            elems[i].innerHTML = content;
                                        }
                                    }
                                }
                            }

                            function removeMetaTags(metaName){
                                var metas = document.getElementsByTagName('meta'); 
                                for (i=0; i<metas.length; i++) {
                                    if (metas[i].getAttribute("name") && (metas[i].getAttribute("name") == metaName)) { 
                                        metas[i].parentNode.removeChild(metas[i]);
                                    } 
                                } 
                            }

                            // adding static comment
                            var comment = document.createComment(" STATIC PAGE CREATED WITH PHANTOMJS-AJAX-SNAPSHOT AT: "+new Date()+" ");
                            document.body.insertBefore(comment, document.body.firstChild);
                            
                            var afiltersById = [].concat( filtersById );
                            for(var j=0; j<afiltersById.length; j++){
                                var aFilter = afiltersById[j];
                                // remove() no funciona
                                var elem = document.getElementById(aFilter);
                                if(elem != undefined){
                                    elem.parentNode.removeChild(elem);
                                }
                            }

                            var afiltersByClass = [].concat( filtersByClass );
                            for(var k=0; k<afiltersByClass.length; k++){
                                var aClassFilter = afiltersByClass[k];
                                //console.log("Filtro clase por: ",aClassFilter);                                
                                replaceContentInContainer(aClassFilter, '');
                            }

                            var afiltersByMetaTag = [].concat( filtersByMetaTag );
                            for(var l=0; l<afiltersByMetaTag.length; l++){
                                var aMetaFilter = afiltersByMetaTag[l];
                                removeMetaTags(aMetaFilter);
                            }
                            
                            return document.documentElement.outerHTML;
                        }, scriptOpts['-idlist'], scriptOpts['-classlist'], scriptOpts['-metalist']);

                        if(scriptOpts['-format'] != 'html') {
                            page.render(output, {format: scriptOpts['-format'], quality: '100'}, function () {
                                return next(status, url, output);
                            });
                            //phantom.exit();
                        } else {
                            fs.write(output, finalContent, 'w');
                        }
                        return next(status, url, output);
                    }), scriptOpts['-t']);
                } else {
                    /*
                    console.log(
                        "Error opening url \"" + page.reason_url
                        + "\": " + page.reason
                    );
                    */
                    return next(status, url, output);
                }
            });
        } else {
            return callbackFinal();
        }
    };
    return retrieve();
};

console.log("\n\nPhantomJs-Ajax-Snapshot\n\n-----------------------\n\n");
var scriptOpts = parseArgs();
/*
(sourceFile | sourceUrl)
-sourceFile    (string) file with json array format, containing the set of urls to generate.
-sourceUrl    (string) single url to visit.

-basePath    (string) common basepath among urls.
-separator    (string) separator to replace '/' in file names ([---] by default).
-waitingTime    (miliseconds) Use specified waiting time to load javascript of every page (3000 by default).
-outputDir    (string) place to write the output files (static/ by default).
-idlist    (Array) elements id to strip in html (empty by default).
-classlist    (Array) elements class to strip in html (empty by default).
-metalist    (Array) elements metaname to strip in html (empty by default).
-debug    (boolean) Enables debug messages (false by default).
*/

scriptOpts['-source'] = scriptOpts['-sourceurl'] || scriptOpts['-sourcefile'];
scriptOpts['-separator'] = scriptOpts['-separator'] || '[---]';
scriptOpts['-useragent'] = scriptOpts['-useragent'] || 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/53 (KHTML, like Gecko) Chrome/15.0.87';
scriptOpts['-basepath'] = scriptOpts['-basepath'] || 'www.url-with-ajax.com/common-base/path/';
scriptOpts['-outputdir'] = scriptOpts['-outputdir'] || 'snapshots/';
scriptOpts['-t'] = (scriptOpts['-t'] && !isNaN(scriptOpts['-t'])) ? parseInt(scriptOpts['-t']) : 3000;
scriptOpts['-idlist'] = scriptOpts['-idlist'] || [];
scriptOpts['-classlist'] = scriptOpts['-classlist'] || [];
scriptOpts['-metalist'] = scriptOpts['-metalist'] || [];
scriptOpts['-format'] = scriptOpts['-format'] || 'html';

console.log("OPTIONS"+((Object.keys(scriptOpts).length === 0) ? ' BY DEFAULT' : '')+":\n"+
    "\n- source (-source):", scriptOpts['-source'],
    "\n- basepath (-basepath):",scriptOpts['-basepath'],
    "\n- output directory (-outputdir):",scriptOpts['-outputdir'],
    "\n- separator (-separator):",scriptOpts['-separator'],
    "\n- user agent (-useragent):",scriptOpts['-useragent'],
    "\n- waiting time (-t):",scriptOpts['-t']," msec.",
    "\n- filtersById (-idlist):",scriptOpts['-idlist'],
    "\n- filtersByClass (-classlist):",scriptOpts['-classlist'],
    "\n- filtersByMetaTag (-metalist):",scriptOpts['-metalist'],
    "\n- output format? (-debug):",scriptOpts['-format'],
    "\n- debug enabled? (-debug):",scriptOpts['-debug'],
    "\n\n"
    );

var arrayOfUrls = (scriptOpts['-sourceurl']) ? [scriptOpts['-sourceurl']] : JSON.parse(readFile(scriptOpts['-sourcefile']));
console.log(arrayOfUrls.length,' urls to process\n------------------');

RenderUrlsToFile(arrayOfUrls, scriptOpts, (function(status, url, file) {
    if (status !== "success") {
        console.log("Unable to render '" + url + "'");
    } else {
        console.log("Saved '" + url + "' at file '" + file + "'");
    }
}), function() {
    console.log("\n\n\nProcess finished!");
    console.log("\n\nhttps://github.com/ericzon/phantomjs-ajax-snapshot");
    phantom.exit();
});
