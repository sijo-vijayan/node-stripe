'use strict';

var mongoose = require( 'mongoose' );
var config = require( './index.js' );


console.log("=========================");
console.log(process.env.MONGOHQ_URL);
mongoose.connect( process.env.MONGOHQ_URL );
