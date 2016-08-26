(function(){
    angular.module('pleasantPastureApp')
        .controller('peopleController', ['$scope', 'peopleProvider', '$rootScope', 'activityProvider', 'logProvider', function ($scope, peopleProvider, $rootScope, activityProvider, logProvider) {
            $scope.people = peopleProvider.people;
            $scope.registerUser = peopleProvider.registerUser;

            $scope.selectPerson = function(person){
                $rootScope.selectedPerson = person;
                $rootScope.selectedDate = new Date();
                activityProvider.reconcileDaysActivities();
            };

            peopleProvider.peopleLoaded.then(function(){
                if ($scope.people.length > 0) {
                    $rootScope.selectedPerson = $scope.people[0];
                }
            });
        }]);
})();