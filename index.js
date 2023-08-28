const fs     = require('fs');
const https  = require('https');
const xml2js = require('xml2js');


/** LaTeX table header. */
const LATEX_TABLE_HEADER = '' +
`\\begin{tabular}{|l|l|l|l|l|l|}
\\hline
S. No. & Authors & Title & Name of the Journal/Conference & Pages & Year \\\\ \\hline
`;

/** LaTeX table footer. */
const LATEX_TABLE_FOOTER = '' +
`\\end{tabular}\n`;




/**
 * Fetch the given URL and return the response body as a string.
 * @param {string} url URL to fetch
 * @returns {Promise<string>} response body
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    var req = https.get(url, res => {
      switch (res.statusCode) {
        default:
          reject(new Error(`Request Failed. Status Code: ${statusCode}`));
          res.resume();
          return;
        case 301:
        case 302:
          return fetchUrl(res.headers.location);
        case 200:
          res.setEncoding('utf8');
          let rawData = '';
          res.on('data', chunk => { rawData += chunk; });
          res.on('end', () => resolve(rawData));
          return;
      }
    });
    req.on('error', err => reject(err));
    req.end();
  });
}


/**
 * Create a regular expression from the given string.
 * @param {string} txt string to convert to a regular expression
 * @returns {RegExp} regular expression
 */
function createRegexp(txt) {
  var re    = txt.replace(/^\/(.*)\/[gimy]*$/, '$1');
  var flags = txt.replace(/.*\/([gimy]*)$/, '$1');
  return new RegExp(re, flags);
}




/**
 * Extract the publication data from the given XML string from DBLP.
 * @param {object} xml XML string from DBLP
 * @returns {object[]} array of publication objects
 */
function extractPublications(xml) {
  var a = [];
  var name = xml.dblpperson.$.name;  // Person name
  var pubs = xml.dblpperson.r;       // Publications
  for (var i=0; i<pubs.length; ++i) {
    for (var type in pubs[i]) {
      for (var p of pubs[i][type])
        a.push(Object.assign({type}, p));
    }
  }
  return a;
}


/**
 * Filter the given array of publication objects.
 * @param {object} pubs array of publication objects
 * @param {RegExp} author author name to filter by
 * @param {RegExp} title title to filter by
 * @param {RegExp} journal journal name to filter by
 * @param {number[]} year year range to filter by
 * @returns {object[]} filtered array of publication objects
 */
function filterPublications(pubs, author, title, journal, year) {
  var a = [];
  for (var p of pubs) {
    var pauthor  = (p.author || p.editor).map(x => x._).join(' and ');
    var ptitle   = (p.title   || p.booktitle || p.chaptertitle)[0];
    var pjournal = (p.journal || p.booktitle || p.publisher)[0];
    var pyear    = parseInt(p.year[0], 10);
    if (author  && !author .test(pauthor))  continue;
    if (title   && !title  .test(ptitle))   continue;
    if (journal && !journal.test(pjournal)) continue;
    if (year && (pyear<year[0] || pyear>year[1])) continue;
    a.push(p);
  }
  return a;
}




/**
 * Convert the given publication object to a BibTeX string.
 * @param {object} p publication object
 * @returns {string} BibTeX string
 */
function convertPublicationToBibTeX(p) {
  var a = '';
  var ptitle   = (p.title   || p.booktitle || p.chaptertitle)[0];
  var pauthor   = p.author? p.author.map(x => x._).join(' and ') : '';
  var peditor   = p.editor? p.editor.map(x => x._).join(' and ') : '';
  var pyear     = parseInt(p.year[0], 10);
  var ptype     = p.type;
  var pnamekey  = (pauthor || peditor).split(' ').slice(-1)[0].toLowerCase();
  var ptitlekey = ptitle.split(' ').slice(0, 1)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  var pkey      = `${pnamekey}${pyear}${ptitlekey}`;
  a += `@${ptype}{${pkey},\n`;
  if (pauthor)  a += `  author = {${pauthor}},\n`;
  if (peditor)  a += `  editor = {${peditor}},\n`;
  for (var k in p) {
    if (k==='$' || k==='author' || k==='editor' || k==='type') continue;
    a += `  ${k} = {${p[k][0]}},\n`;
  }
  a += `}\n`;
  return a;
}


/**
 * Convert the given array of publication objects to a BibTeX string.
 * @param {object[]} pubs array of publication objects
 * @returns {string} BibTeX string
 */
function convertPublicationsToBibTeX(pubs) {
  var a = '';
  for (var pub of pubs) {
    a += convertPublicationToBibTeX(pub);
    a += '\n';
  }
  return a;
}




/**
 * Convert the given publication objects to a LaTeX table.
 * @param {object[]} pubs array of publication objects
 * @returns {string} LaTeX table
 */
function convertPublicationsToLatexTable(pubs) {
  var a = LATEX_TABLE_HEADER;
  var sno = 0;
  for (var p of pubs) {
    var pauthor  = (p.author || p.editor).map(x => x._).join(' and ');
    var ptitle   = (p.title   || p.booktitle || p.chaptertitle)[0];
    var pjournal = (p.journal || p.booktitle || p.publisher)[0];
    var pyear    = parseInt(p.year[0], 10);
    var ppages   = p.pages? p.pages[0]  : '';
    a += `${++sno} & ${pauthor} & ${ptitle} & ${pjournal} & ${ppages} & ${pyear} \\\\ \\hline\n`;
  }
  a += LATEX_TABLE_FOOTER;
  return a;
}



/**
 * Generate a LaTeX table from the given publication data.
 */
async function main(argv) {
  // Parse command line options.
  var o = {};
  for (var i=2; i<argv.length;)
    i = parseOption$(o, argv[i], argv, i);
  if (!o.url)  o.error = 'No URL specified!';
  if (o.error) { console.error(`ERROR: ${o.error}!`); showHelp(); return; }
  if (o.help)  { showHelp(); return; }
  // Fetch the URL and parse the XML.
  console.error(`Fetching ${o.url} and parsing XML ...`);
  var data = await fetchUrl(o.url.replace(/\.html$/, '.xml'));
  var xml  = await xml2js.parseStringPromise(data);
  // Extract and filter the publications.
  console.error('Extracting and filtering publications ...');
  var pubs = extractPublications(xml);
  var pubs = filterPublications(pubs, o.author, o.title, o.journal, o.year);
  // Convert the publications to the desired output format, and display or save.
  console.error('Converting publications to the desired output format ...');
  var ans  = o.mode==='bibtex'? convertPublicationsToBibTeX(pubs) : convertPublicationsToLatexTable(pubs);
  if (o.output) fs.writeFileSync(o.output, ans);
  else console.log(ans);
}


/**
 * Parse an option from the arguments array.
 * @param {object} o options object (updated)
 * @param {string} k option key
 * @param {string[]} a arguments array
 * @param {number} i index into arguments array
 * @returns {number} new index into arguments array
 */
function parseOption$(o, k, a, i) {
  if (k==='-o' || k==='--output')       o.output  = a[++i];
  else if (k==='-a' || k==='--author')  o.author  = createRegexp(a[++i]);
  else if (k==='-t' || k==='--title')   o.title   = createRegexp(a[++i]);
  else if (k==='-j' || k==='--journal') o.journal = createRegexp(a[++i]);
  else if (k==='-y' || k==='--year')    o.year = a[++i].split('-').map(x => parseInt(x, 10));
  else if (k==='-h' || k==='--help')    o.help = true;
  else if (k.startsWith('-')) o.error = `Unknown option: ${k}`;
  else if (!o.mode) o.mode = k;
  else o.url = k;
  return ++i;
}


/**
 * Display the help message.
 */
function showHelp() {
  console.log('Usage: script-publications-list <mode> [options] <url>');
  console.log('Options:');
  console.log('  <mode>                  output mode (bibtex, latex-table)');
  console.log('  <url>                   URL to fetch');
  console.log('  -o, --output <file>     output file');
  console.log('  -a, --author <regexp>   author name to filter by');
  console.log('  -t, --title <regexp>    title to filter by');
  console.log('  -j, --journal <regexp>  journal name to filter by');
  console.log('  -y, --year <range>      year range to filter by');
  console.log('  -h, --help              display this help message');
}
main(process.argv);
