const fs = require('fs');
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const HttpError = require('./models/http-error');
const mongoose = require('mongoose');

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');

const app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

    next();
});

app.use('/api/users', usersRoutes); 
app.use('/api/places', placesRoutes);

app.use((req, res, next) => {
const error = new HttpError('could not find a route', 404);
throw error;
});

app.use((error, req, res, next)=>{
    if(req.file){
        fs.unlink(req.file.path, err=>{
            console.log(err);
        });
    }
if (res.headerSent){
    return next(error)
}
res.status(error.code || 500)
res.json({message: error.message || 'unkown erroor occured'})
});

mongoose
//.connect('mongodb://localhost:27017/place')
.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.CL_NAME}.ll1tv.mongodb.net/?retryWrites=true&w=majority&appName=${process.env.DB_NAME}`)
.then(()=>{
    console.log("connection successfull")
    app.listen(5000);
})
.catch(err =>{
    console.log(err);
});
