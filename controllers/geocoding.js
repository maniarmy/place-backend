const axios = require('axios');
const HttpError = require('../models/http-error');

const getCoordinates = async (address, next) => {
    const url = 'https://nominatim.openstreetmap.org/search';
    let coordinates;

    try {
        const response = await axios.get(`${url}?format=json&q=${encodeURIComponent(address)}`);
        if (response.data.length > 0) {
            coordinates = {
                lat: parseFloat(response.data[0].lat),
                lng: parseFloat(response.data[0].lon),
            };
            return coordinates; // Return the coordinates
        } else {
            throw new Error('Could not find coordinates for the provided address.');
        }
    } catch (err) {
        return next(new HttpError('Could not geocode the address, please check the input.', 422));
    }
};

module.exports = getCoordinates;
