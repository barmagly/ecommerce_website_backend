const express = require('express');
const app = express();

// const users = require("./routers/usrs")

const mongoose = require('mongoose');
app.use(express.json());
app.use(express.static('static'));

mongoose.connect('mongodb://127.0.0.1:27017/-----').then(() => {
    console.log("connection established");
}).catch((err) => {
    console.log(err);
})

var cors = require('cors')
app.use(cors())

// app.use('/airbnb/users', users);

app.use((err, req, res, next) => {
    res.json(err).status(500);
});


app.listen(3000, () => {
    console.log("server started on http://localhost:3000");
})