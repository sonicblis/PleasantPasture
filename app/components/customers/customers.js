(function () {
	angular.module('pleasantPastureApp')
		.component('customers', {
			templateUrl: 'app/components/customers/customers.html',
			controller: CustomersController,
			controllerAs: 'customersController'
		});
})();

function CustomersController() {

}