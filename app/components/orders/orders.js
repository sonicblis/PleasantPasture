(function () {
	angular.module('pleasantPastureApp')
		.component('orders', {
			templateUrl: 'app/components/orders/orders.html',
			controller: OrdersController,
			controllerAs: 'ordersController'
		});
})();

function OrdersController() {

}