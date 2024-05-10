const express = require('express');
const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    const svgFolder = path.join(__dirname, 'public', 'images');
    fs.readdir(svgFolder, (err, files) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server Error');
            return;
        }

        const svgFiles = files.filter(file => path.extname(file) === '.svg');
        const svgData = svgFiles.map(file => {
            const svgText = fs.readFileSync(path.join(svgFolder, file), 'utf8');
            const dom = new JSDOM(svgText);
            const rank = dom.window.document.querySelector('[data-testid="level-rank-icon"]').textContent.trim();

            // 提取 stroke-dashoffset 的值
            const strokeRegex = /stroke-dashoffset:\s*(\d+\.\d+)/g;
            let match;
            let startValue, endValue;
            while ((match = strokeRegex.exec(svgText)) !== null) {
                if (!startValue) {
                    startValue = parseFloat(match[1]);
                } else {
                    endValue = parseFloat(match[1]);
                }
            }
            const offsetDiff = startValue && endValue ? Math.abs(startValue - endValue) : 0;
            return { fileName: file, rank, offsetDiff };
        });

        function rankToSortValue(rank) {
            if (rank.endsWith('-')) {
                return rank.charAt(0) + '2';
            } else if (rank.endsWith('+')) {
                return rank.charAt(0) + '0';
            } else {
                return rank + '1';
            }
        }

        svgData.sort((a, b) => rankToSortValue(a.rank).localeCompare(rankToSortValue(b.rank)) || b.offsetDiff - a.offsetDiff);

        res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>GitHub User Wall</title>
        <style>
          #svg-container {
            display: flex;
            flex-wrap: wrap;
            gap: 2px 4px;
          }
        </style>
      </head>
      <body>
        <h1>GitHub User Wall</h1>
        <div id="svg-container">
          ${svgData.map(file => `<img src="/images/${file.fileName}" />`).join('')}
        </div>
        <p>@tankxu.eth</p>
      </body>
      </html>
    `);
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});