app.directive("nav", [function () {
	return {
		restrict: 'E',
		templateUrl: 'app/nav/nav.html',
		controller: ['$scope', function($scope){}]
	}
}]);