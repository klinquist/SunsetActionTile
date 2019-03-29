var Canvas = require('canvas');
var express = require('express');
const app = express();
const times = require('./lib/getTime');
const moment = require('moment-timezone');

const log = (logMsg) => {
    const now = moment().format('Y-MM-DD h:mm A');
    console.log(`${now} - ${logMsg}`);
};

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


function drawError(text) {
    var Image = Canvas.Image,
        canvas = new Canvas.createCanvas(500, 500),
        ctx = canvas.getContext('2d');
    ctx.font = '30px Impact';
    ctx.fillStyle = 'rgb(255,0,0)';
    ctx.fillRect(0, 0, 500, 500);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const x = canvas.width / 2;
    ctx.fillText(text, x, 250);

    return canvas;
}

function draw(text, size, bgcolor, fgcolor, time) {
    let xSize = Number(size.split('x')[0]);
    let ySize = Number(size.split('x')[1]);

    let fontSize, fontDistance;
    switch (xSize) {
        case 1:
            fontSize = 40;
            fontDistance = 20;
            break;
        case 2:
            fontSize = 80;
            fontDistance = 40;
            break;
        case 3:
            fontSize = 90;
            fontDistance = 50;
    }
    xSize = xSize * 200;
    ySize = ySize * 200;
    var Image = Canvas.Image,
        canvas = new Canvas.createCanvas(xSize, ySize),
        ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px Impact`;
    const hexColor = `#${bgcolor}`;
    const rgbColor = hexToRgb(hexColor);
    if (!rgbColor) return drawError('Invalid fgcolor/bgcolor');
    ctx.fillStyle = `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`;
    ctx.fillRect(0, 0, xSize, ySize);
    ctx.fillStyle = `#${fgcolor}`;
    ctx.textAlign = 'center';
    const x = canvas.width / 2;
    ctx.fillText(text, x, (ySize / 2) - fontDistance + (fontSize / 4));
    ctx.fillText(time, x, (ySize / 2) + fontDistance + (fontSize / 4));

    return canvas;
}


const validate = (lat, long, bgcolor, fgcolor, size) => {
        //validation
    if (!RegExp(/^-?\d+\.\d+$/).test(lat) || !RegExp(/^-?\d+\.\d+$/).test(long)) {
        return 'Invalid lat/long';
    }
    if (!RegExp(/^[0-9a-f]{3,6}$/i).test(bgcolor) || !RegExp(/^[0-9a-f]{3,6}$/i).test(fgcolor)) {
        return 'Invalid fgcolor/bgcolor';
    }
    if (!RegExp(/^[1-3]x[1-3]$/).test(size)) {
        return 'Invalid size';
    }
};

app.get('/sunrise', (req, res, next) => {
    const lat = req.query.lat;
    const long = req.query.long;
    const bgcolor = req.query.bgcolor;
    const fgcolor = req.query.fgcolor;
    const size = req.query.size;
    const timeFormat = req.query.timeformat;
    res.setHeader('Content-Type', 'image/png');
    const validation = validate(lat,long,bgcolor,fgcolor,size);
    if (validation) {
        return drawError(validation).pngStream().pipe(res);
    }
    const sunrise = times.getSunrise(Number(lat), Number(long), timeFormat);
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    log(`${ip} Returning Sunrise for ${lat},${long}`);
    return draw('Sunrise', size, bgcolor, fgcolor, sunrise).pngStream().pipe(res);
});

app.get('/sunset', (req, res, next) => {
    const lat = req.query.lat;
    const long = req.query.long;
    const bgcolor = req.query.bgcolor;
    const fgcolor = req.query.fgcolor;
    const size = req.query.size;
    const timeFormat = req.query.timeformat;
    res.setHeader('Content-Type', 'image/png');
    const validation = validate(lat, long, bgcolor, fgcolor, size);
    if (validation) {
        return drawError(validation).pngStream().pipe(res);
    }
    const sunrise = times.getSunset(Number(lat), Number(long), timeFormat);
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    log(`${ip} Returning Sunset for ${lat},${long}`);
    return draw('Sunset', size, bgcolor, fgcolor, sunrise).pngStream().pipe(res);
});

app.listen(4000, () => console.log('Sunrise/Sunset Tile app listening on port 4000'));