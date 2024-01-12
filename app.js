const express = require('express');
const app = express();
let path    = require("path");
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(__dirname));
app.set('view engine', 'jade');
const filePath = path.join(__dirname, 'views')

app.get ('/', (req, res) => {
  const view = path.join(filePath, 'startPage.html')
  res.sendFile(view)
})

app.get('/trucks', (req, res) => {
  res.render("auto")
})

app.get('/meet', (req, res) => {
  res.render('meet')
})

app.get('/services', (req, res) => {
  res.render('services')
})

const port = 3000;
app.listen(port, () => {
  console.log(`Serverul rulează la adresa http://localhost:${port}`);
});

module.exports = app;
