const fs = require('fs');
const readline = require('readline');

// setting up console input readers
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// taking inputs from user
rl.question('Enter a filename (e.g., test.txt): ', (filename) => {
    rl.question('Enter content to write: ', (content) => {
        // writing to the file first
        fs.writeFile(filename, content, (err) => {
            if (err) throw err;
            console.log('File created and content written successfully.');
            
            // reading it back to check
            fs.readFile(filename, 'utf8', (err, data) => {
                if (err) throw err;
                console.log('\n--- Current File Content ---');
                console.log(data);

                rl.question('\nEnter extra content to append: ', (extra) => {
                    // appending new data
                    fs.appendFile(filename, '\n' + extra, (err) => {
                        if (err) throw err;
                        console.log('Extra content appended successfully.');

                        // final read to show complete file
                        fs.readFile(filename, 'utf8', (err, finalData) => {
                            if (err) throw err;
                            console.log('\n--- Final File Content ---');
                            console.log(finalData);
                            rl.close(); // done closing it
                        });
                    });
                });
            });
        });
    });
});