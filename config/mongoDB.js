'use strict';

var mongoose = require( 'mongoose' );
var config = require( './index.js' );


console.log("=========================");
console.log(process.env.DATABASE_URL);
mongoose.connect( process.env.DATABASE_URL );
