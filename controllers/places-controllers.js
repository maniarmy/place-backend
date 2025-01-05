const fs = require('fs');
const mongoose = require('mongoose');
const {validationResult} = require('express-validator');
const HttpError = require('../models/http-error');
const Place = require('../models/place');
const User = require('../models/user');
const getCoordinates = require('./geocoding');
//const { v4: uuid } = require('uuid');

const getPlaceById = async(req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try{
       place = await Place.findById(placeId);
     }
     catch(err){
     const error = new HttpError(
       'something went wrong, would not find a place', 500
     );
     return next(error) 
     }
  
    if(!place){
      const error =  new HttpError('could not find a place', 404);
      return next(error)
    }
  
    res.json({ place: place.toObject( {getters: true}) });
  }


const getPlacesByUserId = async(req, res, next) => {
    const userId = req.params.uid;
    let userWithPlace;
    try{
      userWithPlace = await User.findById(userId).populate('places');
     }
     catch(err){
     const error = new HttpError(
       'something went wrong, would not find a place', 500
     );
     return next(error)
     }
  
    if(!userWithPlace || userWithPlace.places.length === 0){
      const error =  new HttpError('could not find a place', 404);
      return next(error)
    }
  
    res.json({ places: userWithPlace.places.map(place =>place.toObject( {getters: true})) });
  }

  const createPlace = async(req, res, next) =>{

    const errors = validationResult(req);
    if(!errors.isEmpty()){
     throw new HttpError('Invalid input passed, please check your data', 422)
    }

  const { title, description, address} = req.body;

    let coordinates;
    try {
        coordinates = await getCoordinates(address, next);
        if (!coordinates) return;
    } catch (err) {
        return next(err);
    }

    
    const createdPlace = new Place({
      title,
      description,
      location: coordinates,
      image: req.file.path,
      address,
      creator: req.userData.userId
    });

    let user;
    try{
      user = await User.findById(req.userData.userId);
     }
     catch(err){
     const error = new HttpError(
       'creating a place failed, try again later', 500
     );
     return next(error)
     }

     if(!user){
      const error = new HttpError(
        'something went wrong, could not find a user', 500
      );
      return next(error)
     }

    try{
     const sess = await mongoose.startSession();
     sess.startTransaction();
     await createdPlace.save({session: sess});
     user.places.push(createdPlace);
     await user.save({session: sess});
     await sess.commitTransaction();
    }
    catch(err){
    console.error(err);
    const error = new HttpError(
      'creating a place failed, try again', 500
    );
    return next(error)
    }
    res.status(201).json({place: createdPlace});
  }

  const updatePlace = async(req, res, next) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()){
     return next(
      new HttpError('Invalid input passed, please check your data', 422)
     ) 
    }

    const { title, description, address } = req.body;

    let coordinates;
    try {
        coordinates = await getCoordinates(address, next);
        if (!coordinates) return;
    } catch (err) {
        return next(err);
    }

    const placeId = req.params.pid;
  
    let place;
    try{
       place = await Place.findById(placeId);
     }
     catch(err){
     const error = new HttpError(
       'something went wrong, would not find a place', 500
     );
     return next(error)
     }

     if(place.creator != req.userData.userId){
      const error = new HttpError(
        'you are not allowed to edit this place', 403
      );
      return next(error)
      }

    place.title = title;
    place.description = description;
    place.address = address;
    place.location = coordinates
    
   // Update the image only if a new one is uploaded
  if (req.file) {
    place.image = req.file.path;
   }  

    try{
      await place.save();
     }
     catch(err){
     const error = new HttpError(
       'updating a place failed', 500
     );
     return next(error)
     }

    res.status(200).json({ place: place.toObject( {getters: true}) });
  };

  const deletePlace = async(req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try{
       place = await Place.findById(placeId).populate('creator');//allow us to work with document stored in another collection,here it will serch for creator in place collection then goes to user and search that creator for deleting a place.
     }
     catch(err){
     const error = new HttpError(
       'something went wrong, would not find a place', 500
     );
     return next(error)
     }

     if(!place){
      const error = new HttpError(
        'could not find a place for provided id', 404
      );
      return next(error)
     }

     if(place.creator.id != req.userData.userId){
      const error = new HttpError(
        'you are not allowed to delete this place', 403
      );
      return next(error)
      }

     const imagePath = place.image;

     try{
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await place.deleteOne({session: sess});
      place.creator.places.pull(place);
      await place.creator.save({session: sess});
      await sess.commitTransaction();
     }
     catch(err){
     const error = new HttpError(
       'deleting a place failed', 500
     );
     return next(error)
     }
      
     fs.unlink(imagePath, err=>{
      console.log(err);
      });
      
    res.status(200).json({ message: 'Deleted place.' });
  };

  exports.getPlaceById = getPlaceById;
  exports.getPlacesByUserId = getPlacesByUserId;
  exports.createPlace = createPlace;
  exports.updatePlace = updatePlace;
  exports.deletePlace = deletePlace;

