(function () {
	angular.module('pleasantPastureApp')
		.component('inventory', {
			templateUrl: 'app/components/inventory/inventory.html',
			controller: InventoryController,
			controllerAs: 'inventoryController'
		});

	function InventoryController() {

	}
})();
