(function () {
	angular.module('pleasantPastureApp')
		.service("envService", function () {
			var stripePublicKey = '';
			var pleasantPastureAPIUrl = '';

			this.setStripePublicKey = function(key){
				stripePublicKey = key;
			};
			this.setPleasantPastureAPIUrl = function(url){
				pleasantPastureAPIUrl = url;
			};
			this.getStripePublicKey = function(){
				if (stripePublicKey == '' || stripePublicKey == null || stripePublicKey == undefined){
					throw new Error('The Stripe public key was not set.  Make sure you have an env.json file in your environment.');
				}
				else{
					return stripePublicKey;
				}
			};
			this.getPleasantPastureAPIUrl = function(){
				if (pleasantPastureAPIUrl == '' || pleasantPastureAPIUrl == null || pleasantPastureAPIUrl == undefined){
					throw new Error('The pleasant pasture api url was not set.  Make sure you have an env.json file in your environment.');
				}
				else{
					return pleasantPastureAPIUrl;
				}
			};
		});
})();
