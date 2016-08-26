(function () {
	angular.module('pleasantPastureApp')
		.directive("contactForm", [function () {
			return {
				restrict: 'E',
				templateUrl: 'app/forms/contact/contactForm.html',
				controller: ['$scope', 'firebase', function ($scope, firebase) {
					$scope.saved = false;
					$scope.contact = {};
					$scope.saveContact = function () {
						firebase.contacts.push($scope.contact, function () {
							$scope.saved = true;
							$scope.$digest();
						});
					};
				}]
			}
		}]);
})();