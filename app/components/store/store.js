(function () {
	angular.module('pleasantPastureApp')
		.component('store', {
			templateUrl: 'app/components/store/store.html',
			controller: ["stripeService", StoreController],
			controllerAs: 'storeController'
		});

	function StoreController(stripeService) {
		var self = this;

		function addItem(item){}
		function removeItem(item){}
		function incrementQuantity(cartItem){}
		function decrementQuantity(cartItem){}
		function setInventoryToSelf(inventory){
			return $q(function (resolve, reject) {
				self.inventory = inventory;
				resolve(inventory);
			});
		}

		self.inventory = [];
		self.cart = {
			total: 0,
			items: []
		};

		//init
		stripeService.getInventory()
			.then(self.setInventoryToSelf)
			.catch(console.error);
	}
})();
