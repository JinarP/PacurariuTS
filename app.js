const express = require('express');
const app = express();
let path = require("path");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.set('view engine', 'jade');
const filePath = path.join(__dirname, 'views')
require("dotenv").config();
const key =  process.env.KEY


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
var client = new postmark.ServerClient(key);
const message = (subject, name, email, message) => {

  client.sendEmail({
    "From": "office@pacurariu.com",
    "To": "office@pacurariu.com",
    "Subject": subject,
    "HtmlBody": `<strong>Adresa de email: ${email},  nume: ${name}</strong> <br>`,
    "TextBody": message 
  });
}

const send = (date) => {
  client.sendEmail({
    "From": "office@pacurariu.com",
    "To": "office@pacurariu.com",
    "Subject": `As vrea sa aplic pentru ${date.post}`,
    "HtmlBody": `
    <strong> Contact: </strong>
    <br>
    <strong> Adresa de email: ${date.email} </strong>
     <br>
    <strong> Nume: ${date.fullname} </strong>
    <br>
    <strong> Telefon: ${date.tel} </strong>
    <br>
    <strong> Adresa: ${date.adress} ${date.city} </strong>
    <br>
    <strong> As putea sa incep: ${date.date} </strong>
    <br>
    <strong> CV: ${date.cv} </strong>
    <br>`,
    "TextBody": `${date.despre} `
  });
}

app.post('/send-apply', (req, res) => {
  send(req.body)
  res.render('cariera')
})

app.post('/sent-message', (req, res) => {
  message(req.body.subject, req.body.name, req.body.emailadress, req.body.message)
  res.render('contact')
})

const port = 3000;
app.listen(port, () => {
  console.log(`Serverul rulează la adresa http://localhost:${port}`);
});

module.exports = app;
