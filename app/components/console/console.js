(function(){
	'use strict';

	angular.module('pleasantPastureApp')
		.component('console', {
			templateUrl: 'app/components/console/console.html',
			controller: 'ConsoleController',
			controllerAs: 'console'
		})
		.controller('ConsoleController', function(){
			var ctrl = this;

			ctrl.title = 'Console';
		});
})();