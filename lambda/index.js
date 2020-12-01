process.env.FONTCONFIG_PATH = './fonts';
//process.env.FC_DEBUG = 0xffff;

var Canvas = require('canvas');
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
    var canvas = new Canvas.createCanvas(500, 500),
        ctx = canvas.getContext('2d');
    ctx.font = '30px Helvetica';
    ctx.fillStyle = 'rgb(255,0,0)';
    ctx.fillRect(0, 0, 500, 500);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const x = canvas.width / 2;
    ctx.fillText(text, x, 250);

    return canvas;
}

function draw(text, size, bgcolor, fgcolor, time, fsmultiplier) {
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
    if (fsmultiplier) {
        fontSize = fontSize * Number(fsmultiplier);
        fontDistance = fontDistance * Number(fsmultiplier);
    }
    xSize = xSize * 200;
    ySize = ySize * 200;
    var canvas = new Canvas.createCanvas(xSize, ySize),
        ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px Bitstream Vera Sans`;
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


exports.handler = (event, context, callback) => {

    const contentType = 'image/png';
    const ip = event.requestContext.identity.sourceIp;
    const done = (err, res) => {
        if (err) console.log(`${ip} ValidationError: ${validate}`);
        return callback(null, {
            statusCode: err ? '400' : '200',
            body: res.toString('base64'),
            'isBase64Encoded': true,
            headers:
            {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            }
        });
    };

    let validation = '';

    switch (event.path) {
        case '/sunrise':
            validation = validate(event.queryStringParameters.lat, event.queryStringParameters.long, event.queryStringParameters.bgcolor, event.queryStringParameters.fgcolor, event.queryStringParameters.size);
            if (validation) {
                return done(validation, drawError(validation).toBuffer(contentType));
            }
            const sunrise = times.getSunrise(Number(event.queryStringParameters.lat), Number(event.queryStringParameters.long), event.queryStringParameters.timeformat, event.queryStringParameters.offset);
            log(`${ip} Returning ${event.queryStringParameters.size} sunrise panel for ${event.queryStringParameters.lat},${event.queryStringParameters.long}`);
            return done(null, draw('Sunrise', event.queryStringParameters.size, event.queryStringParameters.bgcolor, event.queryStringParameters.fgcolor, sunrise, event.queryStringParameters.fontsize).toBuffer(contentType));
        case '/sunset':
            validation = validate(event.queryStringParameters.lat, event.queryStringParameters.long, event.queryStringParameters.bgcolor, event.queryStringParameters.fgcolor, event.queryStringParameters.size);
            if (validation) {
                return done(validation, drawError(validation).toBuffer(contentType));
            }
            const sunset = times.getSunset(Number(event.queryStringParameters.lat), Number(event.queryStringParameters.long), event.queryStringParameters.timeformat, event.queryStringParameters.offset);
            log(`${ip} Returning ${event.queryStringParameters.size} sunset panel for ${event.queryStringParameters.lat},${event.queryStringParameters.long}`);
            return done(null, draw('Sunset', event.queryStringParameters.size, event.queryStringParameters.bgcolor, event.queryStringParameters.fgcolor, sunset, event.queryStringParameters.fontsize).toBuffer(contentType));
        case '/text':
            log(`${ip} Returning ${event.queryStringParameters.size} sunset panel for ${event.queryStringParameters.lat},${event.queryStringParameters.long}`);
            return done(null, draw(event.queryStringParameters.line1, event.queryStringParameters.size, event.queryStringParameters.bgcolor, event.queryStringParameters.fgcolor, event.queryStringParameters.line2, event.queryStringParameters.fontsize).toBuffer(contentType));
    }
};
