const { request } = require("https");
const postData = JSON.stringify({
  content: '{"namhe": "vscode"}'
});
const req = request({
  hostname: 'api.jsont.run',
  port: 443,
  path: '/json/share',
  method: 'POST',
  headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
  }
},  (res) => {
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      console.log('结果', chunk)
    });
    res.on('end', () => {
    });
                
    req.on('error', (e) => {
        vscode.window.showErrorMessage(e.message);
    });
})
req.write(postData);
req.end();