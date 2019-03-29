const suncalc = require('suncalc');
const tzlookup = require('tz-lookup');
const moment = require('moment-timezone');



module.exports.getSunset = (lat, long, timeFormat) => {
    const times = suncalc.getTimes(new Date(), lat, long).sunset;
    if (timeFormat == '24') {
        return moment(times).tz(tzlookup(lat, long)).format('H:mm');
    } else {
        return moment(times).tz(tzlookup(lat, long)).format('h:mm A');
    }
};


module.exports.getSunrise = (lat, long, timeFormat) => {
    const times = suncalc.getTimes(new Date(), lat, long).sunrise;
    if (timeFormat == '24') {
        return moment(times).tz(tzlookup(lat, long)).format('H:mm');
    } else {
        return moment(times).tz(tzlookup(lat, long)).format('h:mm A');
    }
};
