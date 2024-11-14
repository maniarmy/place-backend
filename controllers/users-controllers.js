const {validationResult} = require('express-validator');
const HttpError = require('../models/http-error');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//const { v4: uuid } = require('uuid');

const getUsers = async(req, res, next) => {
  let users;
    try{
      users = await User.find({}, '-password');
     }
     catch(err){
     const error = new HttpError(
       'something went wrong, try again later', 500
     );
     return next(error);
     }

     res.json({ users: users.map(user =>user.toObject( {getters: true})) });
};

const signup = async(req, res, next) => {

  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return next(
      new HttpError('Invalid input passed, please check your data', 422)
    ) 
  }

  const { name, email, password} = req.body;

  let existingUser;
    try{
      existingUser = await User.findOne({ email: email});
     }
     catch(err){
     const error = new HttpError(
       'Signup failed, try again later', 500
     );
     return next(error);
     }

  if(existingUser){
    const error = new HttpError(
      'Email already exist', 422
    );
    return next(error);
  }

  let hashedPassword;
  try{
    hashedPassword = await bcrypt.hash(password, 12); //number like 12 show the streghth of the hash.How password is strong encrypted
  }
  catch(err){
    const error = new HttpError('could not create a user', 500);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places:[]
  });

  try{
   await createdUser.save();
  }
  catch(err){
  const error = new HttpError(
    'creating a user failed', 500
  );
  return next(error)
  }

  let token;
  try{
    token = jwt.sign(
      {userId: createdUser.id,
       email: createdUser.email,
      },
      'process.env.JWT_KEY',
      {expiresIn: '1h'}
    );
  }
  catch(err){
    const error = new HttpError(
      'Signup failed, try again later', 500
    );
    return next(error);
    }
  
  res.status(201).json({userId: createdUser.id, email: createdUser.email, token: token });
}

const login = async(req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
    try{
      existingUser = await User.findOne({ email: email});
     }
     catch(err){
     const error = new HttpError(
       'Loggin failed, try again later', 500
     );
     return next(error);
     }

     if(!existingUser){
      const error = new HttpError(
        'Invalid credential, could not log you in', 401
      );
      return next(error);
     }

     let isValidPassword = false;
     try{
      isValidPassword = await bcrypt.compare(password, existingUser.password);
     }
     catch(err){
       const error = new HttpError(
        'Loggin failed, try again later', 500
      );
       return next(error);
     }

     if(!isValidPassword){
      const error = new HttpError(
        'Invalid credential, could not log you in', 401
      );
      return next(error);
     }

     let token;
  try{
    token = jwt.sign(
      {userId: existingUser.id,
       email: existingUser.email,
      },
      'process.env.JWT_KEY',
      {expiresIn: '1h'}
    );
  }
  catch(err){
    const error = new HttpError(
      'login failed, try again later', 500
    );
    return next(error);
    }

  res.json({
    userId: existingUser.id, email: existingUser.email, token: token
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;


