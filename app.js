const express = require('express');
const app = express();
let path = require("path");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.set('view engine', 'jade');
const filePath = path.join(__dirname, 'views')


app.get('/', (req, res) => {
  res.render('contact')
})

app.get('/home', (req, res) => {
  res.render('home')
})

app.get('/about', (req, res) => {
  // 
  res.render('about')
})

app.get('/culture', (req, res) => {
  res.render('culture')
})

app.get('/team', (req, res) => {
  // const view = path.join(filePath, 'team.html')
  // res.sendFile(view)
  res.render('team')
})

app.get('/cariera', (req, res) => {
  res.render('cariera')
})

app.get('/services', (req, res) => {
  res.render('services')
})

var postmark = require("postmark");

// // Example request
var client = new postmark.ServerClient("4613db02-2ea5-4797-8dda-808e69fd429c");
const send = () => {

  client.sendEmail({
    "From": "office@pacurariu.com",
    "To": "office@pacurariu.com",
    "Subject": "test1",
    "HtmlBody": "<strong>salut</strong>",
    "TextBody": "buna seara!",
    "MessageStream": "outbound"
  });
}

app.get('/send', (req, res) => {
  send();
  res.render('cariera')
})

const port = 3000;
app.listen(port, () => {
  console.log(`Serverul rulează la adresa http://localhost:${port}`);
});

module.exports = app;
