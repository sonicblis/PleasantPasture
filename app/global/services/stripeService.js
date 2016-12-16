(function(angular, stripe){
	angular.module('pleasantPastureApp')
		.run(function(){
			stripe.setPublishableKey('pk_test_NbvQO6DSbEouUSzP16cCvpTx');
			function cardInfo(number, cvc, monthExpires, yearExpires){
				this.number = number;
				this.cvc = cvc;
				this.exp_month = monthExpires;
				this.exp_year = yearExpires;
			}
		})
		.service('stripeService', ['$q', '$http', function($q, $http){
			function getInventory() {
				return $q(function (resolve, reject) {
					$http.get('http://localhost:8088/api/products').then(function(result){
						resolve(result.data.data);
					});
				});
			}
			function chargeCard(token, order){
				return $q(function (resolve, reject) {
					debugger;
					$http.post('http://localhost:8088/api/charge', {
						token: token,
						orderId: order.id
					}).then(
						function(result){ resolve(result.data); },
						function(result){ reject(result); }
					);
				});
			}
			function createOrder(order){
				return $q(function (resolve, reject) {
					$http.post('http://localhost:8088/api/order', order)
						.then(
							function(result){ resolve(result.data); },
							function(result){ reject(result); }
						);
				});
			}
			function updateOrder(order){
				return $q(function (resolve, reject) {
					$http.put('http://localhost:8088/api/order', order)
						.then(
							function(result){ resolve(result.data); },
							function(result){ reject(result); }
						);
				});
			}
			function createToken(cardInfo){
				return $q(function (resolve, reject) {
					stripe.card.createToken(cardInfo, function(status, response){
						debugger;
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
		}]
	)
})(angular, Stripe);