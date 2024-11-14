const express = require('express');
const {check} = require('express-validator');
const usersController = require('../controllers/users-controllers');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/', usersController.getUsers);

router.post('/signup',
    fileUpload.single('image'),
    [
        check('name')
        .not()
        .isEmpty(),
        check('email')
        .normalizeEmail()  //convert Test@test.com to test@test.com
        .isEmail(), // check if an email is valid
        check('password')
        .isLength({min: 8})
        ],
    usersController.signup);

router.post('/login', usersController.login);

module.exports = router;
