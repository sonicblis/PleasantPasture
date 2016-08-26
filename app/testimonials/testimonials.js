(function () {
	angular.module('pleasantPastureApp')
		.directive("testimonials", [function () {
			return {
				restrict: '',
				templateUrl: 'app/testimonials/testimonials.html',
				controller: ['$scope', 'firebase', 'firebaseArrayWatcher', function ($scope, firebase, firebaseArrayWatcher) {
					$scope.testimonials = firebaseArrayWatcher.getWatcher(firebase.testimonials.orderByChild('product').equalTo('soap'));
				}]
			}
		}]);
})();
