(function(angular){
	'use strict';

	angular.module('pleasantPastureApp')
		.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
			$urlRouterProvider.otherwise("/");

			$stateProvider
				.state('public', {
					url: "/",
					templateUrl: 'app/public/public.html',
					redirectTo: 'public.home'
				})
				.state('public.home', {
					url: "home",
					templateUrl: "app/home/home.html"
				})
				.state('public.eggs', {
					url: "eggs",
					templateUrl: "app/eggs/eggInfo.html",
				})
				.state('public.soap', {
					url: "soap",
					templateUrl: "app/Soap/SoapInfo.html"
				})
				.state('public.chicken', {
					url: "chicken",
					templateUrl: "app/chicken/chicken.html"
				})
				.state('public.map', {
					url: "map",
					templateUrl: "app/map/map.html"
				})
				.state('public.store', {
					url: "store",
					template: '<store></store>'
				})
				.state('app', {
					url: '/app',
					redirectTo: 'app.orders',
					template: '<console></console>'
				})
				.state('app.orders', {
					url: '/orders',
					template: '<orders></orders>'
				})
				.state('app.inventory', {
					url: '/inventory',
					template: '<inventory></inventory>'
				})
				.state('app.customers', {
					url: '/customers',
					template: '<customers></customers>'
				})
		}]);
	}
)(angular);