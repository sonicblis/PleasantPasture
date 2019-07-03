(function () {
	angular.module('pleasantPastureApp')
		.directive("contactForm", [function () {
			return {
				restrict: 'E',
				templateUrl: 'app/forms/contact/contactForm.html',
				controller: ['$scope', 'firebase', 'envService', '$http', function ($scope, firebase, envService, $http) {
					$scope.saved = false;
					$scope.contact = {
						name: '',
						email: '',
						interests: {
							eggs: false,
							chicken: false,
							turkey: false,
							goatMilkSoap: false
						},
						message: '',
						subscriber: false
					};
					$scope.saveContact = function () {
						$scope.contact.sentAt = new Date().getTime();
						firebase.contacts.push($scope.contact, function () {
							$scope.saved = true;
							$scope.$digest();
							$http.post(envService.getPleasantPastureAPIUrl() + 'message', $scope.contact);
						});
					};
				}]
			}
		}]);
})();