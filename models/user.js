const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');//mongoose-unique-validator validate if email already exist or not

const Schema = mongoose.Schema;


const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },// unique enable fast query processing
    password: { type: String, required: true, minlength: 8 },
    image: { type: String, required: true },
    places: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Places' }]
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
