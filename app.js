const express = require('express');
const app = express();
let path    = require("path");
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(__dirname));
app.set('view engine', 'jade');
const filePath = path.join(__dirname, 'views')


app.get ('/', (req, res) => {
  res.render('contact')
})

app.get('/home', (req, res) => {
  res.render('home')
})

app.get('/about', (req, res) => {
  const view = path.join(filePath, 'about.html')
  res.sendFile(view)
})

app.get('/services', (req, res) => {
  res.render('services')
})

app.get('/blog' , (req, res) => {
   res.render('blog')
})



const port = 3000;
app.listen(port, () => {
  console.log(`Serverul rulează la adresa http://localhost:${port}`);
});

module.exports = app;
