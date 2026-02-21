const path = require('path');
const fs = require('fs');

const docsJsonOutputFilePath = path.join('.', 'docs.json');

const docsJsonContents = JSON.parse(fs.readFileSync(docsJsonOutputFilePath));

// these two fields will vary given the machine and so on that the application
// is built on, so we need to just delete them
delete docsJsonContents['timestamp'];
delete docsJsonContents['compiler'];

// then rewrite the file, indenting the JSON for easy reading.
fs.writeFileSync(docsJsonOutputFilePath, JSON.stringify(docsJsonContents, null, 2));
