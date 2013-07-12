#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var rest = require('restler');
var HTMLFILE_DEFAULT="index.html"
var CHECKSFILE_DEFAULT="checks.json"
var cheerio = require('cheerio');

var assertUrlExists = function(inURL) {
    rest.get(inURL).on('complete', function(result) {
        if (result instanceof Error) {
            console.log("error, exiting: %s",result);
            process.exit(1);
        }
        else {
		console.log(result);
        }
});
};

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

function downloadHtml(url, callback)
{
 var html = rest.get(url).on('complete',function(result)
			     {
				 if(result instanceof Error)
				     {
					 console.error('Error: ' + util.format(response.message));
				     }
				 else
				     {
					 callback(null,result);
				     }
			     }
			   );
}

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

function checkHtml(html, checks) {
    $ = cheerio.load(html);
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};
function checkHtmlFile(fileName, checks){
    return checkHtml(fs.readFileSync(fileName), checks);
}

//Checks in the given stream (file/url) - if all of the tokens from the checksFile are present. 
if(require.main == module)
{
    program
    .option('-c,--checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f,--file <html_file>', 'Path to index.html', clone(assertFileExists))
    .option('-u,--url <url>', 'Url to index.html')
    .parse(process.argv);
  
//Main check function - gets html in the form of string. (either from file or from url)
    function performCheck(error, html)
    {
	if(error)
	{
	    console.log("Error opening stream:%s",error);
	    process.exit(1);
	}
	var checks = loadChecks(program.checks);
	var checkJson = checkHtml(html, checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }

    if( program.file )
    {
       fs.readFile(program.file, performCheck);
    }
    else if(program.url)
    {
	/*
	  1. Fetch the url and save it into a file.
	  2. call checkHtmlFile
	*/ 
	downloadHtml(program.url,performCheck);   
    }
    else
    {
	exports.loadChecks = loadChecks;
	exports.checkHtmlFile = checkHtmlFile;
    }
}





