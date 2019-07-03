(function(angular, stripe){
	angular.module('pleasantPastureApp')
		.service('stripeService', ['$q', '$http', 'envService', function($q, $http, envService){
			stripe.setPublishableKey(envService.getStripePublicKey());
			var apiBaseUrl = envService.getPleasantPastureAPIUrl();

			function getInventory() {
				return $q(function (resolve, reject) {
					$http.get(apiBaseUrl + 'products').then(function(result){
						resolve(result.data.data);
					});
				});
			}
			function chargeCard(token, order){
				return $q(function (resolve, reject) {
					$http.post(apiBaseUrl + 'charge', {
						token: token,
						orderId: order.id,
						email: order.email
					}).then(
						function(result){
							console.log('card charge success', result);
							resolve(result.data);
						},
						function(result){
							console.log('card charge error', result);
							reject(result);
						}
					);
				});
			}
			function createOrder(order){
				return $q(function (resolve, reject) {
					$http.post(apiBaseUrl + 'order', order)
						.then(
							function(result){ resolve(result.data); },
							function(result){ reject(result); }
						);
				});
			}
			function updateOrder(order){
				return $q(function (resolve, reject) {
					$http.put(apiBaseUrl + 'order', order)
						.then(
							function(result){ resolve(result.data); },
							function(result){ reject(result); }
						);
				});
			}
			function cancelOrder(order){
				return $q(function (resolve, reject) {
					$http.delete(apiBaseUrl + 'order/' + order.id)
						.then(
							function(result){ resolve(result.data); },
							function(result){ reject(result); }
						);
				});
			}
			function createToken(cardInfo){
				return $q(function (resolve, reject) {
					stripe.card.createToken(cardInfo, function(status, response){
						if (response.error){
							reject(response.error);
						}
						else{
							resolve(response.id);
						}
					});
				});
			}

			this.getInventory = getInventory;
			this.chargeCard = chargeCard;
			this.creatOrder = createOrder;
			this.updateOrder = updateOrder;
			this.createToken = createToken;
			this.cancelOrder = cancelOrder;
		}]
	)
})(angular, Stripe);
