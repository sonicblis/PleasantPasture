(function () {
	angular.module('pleasantPastureApp')
		.directive("map", [function () {
			return {
				restrict: 'E',
				templateUrl: 'app/global/content/map/map.html',
				controller: ['$scope', function ($scope) {

				}]
			}
		}]);
})();