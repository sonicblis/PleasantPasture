(function(angular){
	angular.module('pleasantPastureApp')
		.service('stripeService', function(){
			function getInventory(){
				return $q(function (resolve, reject) {
					resolve([
						{
							name: "Perfect Man",
							price: 5.99,
							img: '',
							quantity: 22
						},
						{
							name: "Mulled Cider",
							price: 5.99,
							img: '',
							quantity: 12
						}
					]);
				});
			}

			this.getInventory = getInventory;
		}
	)
})(angular);