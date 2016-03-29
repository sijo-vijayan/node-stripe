'use strict';

/*global Stripe:true*/
/*global $form:true*/

//set Public key for Stripe payments
Stripe.setPublishableKey( 'pk_test_TZzwRlvhOAknpbeFcRIW4pCB' );
var isSubmit = false;
$( document ).ready( function() {

    $( '#use_saved_card' ).click( function() {
		if( $("#use_saved_card").is(':checked')){
			$("#card-details").hide();
		}else{
			$("#card-details").show();
		}
	});

	var showMessage = function(response){
		if ( response.status ) {
			$( '#success-alert' ).text( response.message );
			$( '#success-alert' ).show();
		}else{
			$( '#danger-alert' ).text( response.message );
			$( '#danger-alert' ).show();
		}
	}
    $( '#submittransaction' ).click( function() {
        
        if( !isSubmit ){

            var tockenParams = {
                number: $( '.card-number' ).val(),
                cvc: $( '.card-cvc' ).val(),
                exp_month: $( '.card-expiry-month' ).val(),
                exp_year: $( '.card-expiry-year' ).val()
            };

            var siteTocken = $( '#token' ).val();

			// Use saved card
			if($("#use_saved_card").val()==='1'){
				$.ajax( {
					url: '/create_transaction_by_saved_card',
					type: 'POST',
					headers: {
						'x-access-token': siteTocken
					},
					data: {
						amount: $( '#amount' ).val(),
						currency: $( '#currency' ).val()
					}
					// tocken key name changed to 'source_token' to avoid tocken overriding issue
				}).done( function( response ) {
					showMessage(response);
				});
			}else{

				Stripe.card.createToken( tockenParams, function( status, response ) {
					if ( response.error ) {
						// Show the errors on the form
						showMessage({ message: response.error.message, status: false });
					}
					else {
						// response contains id and card, which contains additional card details
						var token = response.id;
						$.ajax( {
							url: '/createtransaction',
							type: 'POST',
							headers: {
								'x-access-token': siteTocken
							},
							data: {
								amount: $( '#amount' ).val(),
								currency: $( '#currency' ).val(),
								source_token: token
							}
							// tocken key name changed to 'source_token' to avoid tocken overriding issue
						}).done( function( response ) {
							showMessage(response);
						});
					}
				});

				// To save credit card for future usage
				Stripe.card.createToken( tockenParams, function( status, response ) {
					if ( response.error ) {
						// Show the errors on the form
						$( '#danger-alert' ).text( response.error.message );
						
					}else {
						//console.log('////savecard');
						var token = response.id;
						$.ajax({
							url: '/savecard',
							type: 'POST',
							headers: {
								'x-access-token': siteTocken
							},
							data: {
								source_token: token
							}
							// tocken key name changed to 'source_token' to avoid tocken overriding issue
						}).done( function( response ) {
							showMessage(response);
						});
					}
				});
			}
        }
    });
});
