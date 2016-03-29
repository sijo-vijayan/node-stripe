'use strict';

var Transactions = require( '../models/transactions.model.js' );
var User = require( '../models/user.model.js' );
var config = require( '../config' );
var Stripe = require( 'stripe' )( config.stripeApiKey );
var ObjectId = require('mongoose').Types.ObjectId;

exports.index = function( req, res, next ) {
    if ( req.body ) {
        var transaction = new Transactions( {
            name: req.body.name
        } );
        transaction.save( function( err, trans ) {
            if ( err ) {
                return console.log( err );
            }
            res.status( 200 ).end();
        } );
    }
};

exports.createTransaction = function( req, res, next ) {

	// tocken key name changed to 'source_token' to avoid tocken overriding issue
	var userObj = req.decoded._doc;
	var name = (userObj.name) ? userObj.name: 'None';
	var id = (userObj._id) ? userObj._id: 'None';
    Stripe.charges.create( {
        amount: req.body.amount,
        currency: req.body.currency,
        source: req.body.source_token,
        description: 'customer username :' + name + ', id: '+ id
    }, function( err, charge ) {
        if ( err ) {
			res.status( 200 ).json( {
				status: false,
				message: err.message
			} );
        }else{
			
			var transaction = new Transactions({
				transactionId: charge.id,
				amount: charge.amount,
				created: charge.created,
				currency: charge.currency,
				description: charge.description,
				paid: charge.paid,
				sourceId: charge.source.id
			});
			transaction.save( function( err ) {
				if ( err ) {
					res.status( 200 ).json( {
						status: false,
						message: 'Payment failed.'
					} );
				}
				else {
					res.status( 200 ).json( {
						status: true,
						message: 'Payment is created.'
					} );
				}
			} );
		}
		// asynchronously called
    } );
};

// This function is used to save card details for the future usage
exports.saveCard = function( req, res, next ) {

	var userObj = req.decoded._doc;
	var name = (userObj.name) ? userObj.name: 'None';
	var id = (userObj._id) ? userObj._id: 'None';
    Stripe.customers.create( {
        source: req.body.source_token,
        description: 'customer username :' + name + ', id: '+ id
    }, function( err, charge ) {
		if ( err ) {
			res.status( 200 ).json( {
				status: false,
				message: err
			} );
		}
		else {
			// save customer object in database
			console.log(charge);
			if(charge && charge.id){
				var conditions = {
					_id: new ObjectId(userObj._id)
				};

				var update  = { card : charge.id };
				var options = { multi: false };
				User.update(conditions, update, options, function (err) {
					if (!err) {

						console.log('update done');
					} else {

						console.log(err);
					}
				});
			}
			res.status( 200 ).json( {
				status: true,
				message: 'card saved.'
			} );
		}
    } );
};

// Create Transaction By Saved Card
exports.createTransactionBySavedCard = function( req, res, next ) {

	var makeTransaction = function(customer_id){
		Stripe.charges.create( {
			amount: req.body.amount,
			currency: req.body.currency,
			customer: customer_id
		}, function( err, charge ) {
			if ( err ) {
				res.status( 200 ).json( {
					status: false,
					message: err.message
				} );
			}else{
				
				var transaction = new Transactions({
					transactionId: charge.id,
					amount: charge.amount,
					created: charge.created,
					currency: charge.currency,
					description: charge.description,
					paid: charge.paid,
					sourceId: charge.source.id
				});
				transaction.save( function( err ) {
					if ( err ) {
						res.status( 200 ).json( {
							status: false,
							message: 'Payment failed.'
						} );
					}
					else {
						res.status( 200 ).json( {
							status: true,
							message: 'Payment is created...'
						} );
					}
				} );
			}
			// asynchronously called
		} );
	}
	
	var userObj = req.decoded._doc;
	var conditions = {
		_id: new ObjectId(userObj._id)
	};
	User.findOne(conditions, function (err, user) {
		if (!err) {
			// console.log(user);
			var customer_id = (user.card) ? user.card: 'None';
			makeTransaction(customer_id);
		} else {
			res.status( 200 ).json( {
				status: false,
				message: 'Saved card not found..'
			} );
		}
	});

};
