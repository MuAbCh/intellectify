const { S3 } = require('@aws-sdk/client-s3');
const puppeteer = require('puppeteer');
const fs = require('fs');

console.log('Loading function');
const s3 = new S3({ region: 'us-west-2' }); // Replace 'us-west-2' with the region of your bucket

exports.handler = async (event) => {
    const bucket = 'modeltoweb'; // Source S3 bucket name
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: bucket,
        Key: key,
    };

    try {
        const { Body } = await s3.getObject(params);
        const content = Body.toString('utf-8');

        // Your puppeteer logic
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Example keyword and search URL
        const keyword = "Fourier Transform";
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;

        await page.goto(searchUrl, { waitUntil: 'networkidle2' });

        const searchResults = await page.evaluate(() => {
            const results = [];
            const links = document.querySelectorAll('a h3');

            links.forEach(item => {
                const parentElement = item.parentElement;
                if (parentElement && parentElement.href) {
                    results.push({
                        title: item.innerText,
                        url: parentElement.href
                    });
                }
            });

            return results;
        });

        console.log("Retrieved web pages and URLs:");
        searchResults.forEach((result, index) => {
            console.log(`${index + 1}. Title: ${result.title}`);
            console.log(`   URL: ${result.url}\n`);
        });

        let fileContent = "Retrieved web pages and URLs:\n";
        searchResults.forEach((result, index) => {
            fileContent += `${index + 1}. Title: ${result.title}\n`;
            fileContent += `   URL: ${result.url}\n\n`;
        });

        const fileName = 'searchResults.txt';

        fs.writeFileSync(fileName, fileContent); // Use synchronous write to ensure file is created before uploading

        // Upload file to destination S3 bucket
        const uploadParams = {
            Bucket: 'penultimatebucketnew', // Destination S3 bucket name
            Key: fileName,
            Body: fs.readFileSync(fileName),
            ContentType: 'text/plain' // Set the content type if required
        };

        await s3.putObject(uploadParams).promise();

        await browser.close();

        return "Success"; // Return success if everything runs without errors
    } catch (err) {
        console.log(err);
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }
};
