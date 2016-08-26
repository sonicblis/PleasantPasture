(function(){
    angular.module('pleasantPastureApp', ['firebase', 'ui.router'])
        .run(['logProvider', '$rootScope', '$state', function(logProvider, $rootScope, $state){
            logProvider.setLoggingLevels({
                warn: true,
                error: true,
                debug: true,
                info: true
            });

            $rootScope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {
                logProvider.debug('stateChange', 'trying to go to state', toState);
                if (toState.redirectTo) {
                    e.preventDefault();
                    $state.go(toState.redirectTo, toParams, {location: 'replace'});
                }
            });
        }]);
})();
(function(){
	var baseUrl = "pleasantpasture.firebaseio.com";

	angular.module('pleasantPastureApp')
		.constant('firebase', {
		root: new Firebase(baseUrl),
		people: new Firebase(baseUrl + "/people"),
		contacts: new Firebase(baseUrl + "/contacts"),
		testimonials: new Firebase(baseUrl + "/testimonials"),
		events: {
			valueChanged: 'value',
			childAdded: 'child_added',
			childRemoved: 'child_removed'
		},
		getCurrentTime: function () {
			return Firebase.ServerValue.TIMESTAMP;
		},
		stringify: function (firebaseObj) {
			var path = firebaseObj.toString().replace(firebaseObj.root(), ''); //trims the root url from the path
			for (var i in arguments) {
				if (arguments[i] != firebaseObj) {
					path += '/' + arguments[i];
				}
			}
			return decodeURIComponent(path);
		},
		cleanAngularObject: function (object) {
			if (angular) {
				var tempObj = angular.fromJson(angular.toJson(object)); //cleans off all $$hashkey values from child collections
				for (n in tempObj) {
					if (n.substring(0, 1) == '$') {
						delete tempObj[n];
					}
				}
				return tempObj;
			}
			else {
				console.error("Angular is not available to use to clean the angular object.  This method doesn't need to be called in this context.");
			}
		}
	});
})();
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
				.state('public.ap', {
					url: "map",
					templateUrl: "app/map/map.html"
				})
				.state('app', {
					url: '/app',
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
(function () {
	angular.module('pleasantPastureApp')
		.directive("nav", [function () {
			return {
				restrict: 'E',
				templateUrl: 'app/nav/nav.html',
				controller: ['$scope', function ($scope) {
				}]
			}
		}]);
})();

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
(function () {
	angular.module('pleasantPastureApp')
		.directive('focusWhen', function ($timeout, $parse) {
			return {
				link: function (scope, element, attrs) {
					var model = $parse(attrs.focusWhen);
					scope.$watch(model, function (value) {
						if (value === true) {
							$timeout(function () {
								element[0].focus();
							}, 100);
						}
					});
				}
			};
		});
})();
(function () {
	angular.module('pleasantPastureApp')
		.directive('ngEnter', function () {
			return function (scope, element, attrs) {
				element.bind("keydown keypress", function (event) {
					if (event.which === 13) {
						scope.$apply(function () {
							scope.$eval(attrs.ngEnter);
						});
						event.preventDefault();
					}
				});
			};
		});
})();
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
(function () {
	angular.module('pleasantPastureApp')
		.service('firebaseArrayWatcher', ['firebase', '$firebaseArray', 'logProvider', function (firebase, $firebaseArray, logProvider) {
			var watchers = {};
			this.getWatcher = function (firebaseRef, promiseToResolve) {
				if (!watchers[firebaseRef]) {
					watchers[firebaseRef] = [];
					var fbArray = $firebaseArray(firebaseRef);
					if (promiseToResolve) {
						fbArray.$loaded(function () {
							promiseToResolve.resolve();
						});
					}
					fbArray.$watch(function (args) {
						//logProvider.debug('firebaseArrayWatcher', 'Got a firebase array event', args);
						if (args.event === firebase.events.childAdded) {
							watchers[firebaseRef].push(fbArray.$getRecord(args.key));
						}
						else if (args.event === firebase.events.childRemoved) {
							//logProvider.info('firebaseArrayWatcher', 'Removing array entry with key', args.key);
							var removedItem = watchers[firebaseRef].find(function (activity) {
								return activity.$id == args.key;
							});
							watchers[firebaseRef].splice(watchers[firebaseRef].indexOf(removedItem), 1);
						}
					});
				}
				return watchers[firebaseRef];
			}
		}]);
})();
(function () {
	angular.module('pleasantPastureApp')
		.service("logProvider", ['firebase', function (firebase) {
			var levels = {
				warn: false,
				info: false,
				debug: false,
				error: true
			};

			function log(level, context, message, args) {
				var context = ((context) ? '[' + context + ']: ' : '');
				if (typeof args !== 'undefined') {
					console[level](context + message + ":", args);
				}
				else {
					console[level](context + message);
				}
			}

			this.setLoggingLevels = function (levelSettings) {
				levels.warn = levelSettings.warn;
				levels.info = levelSettings.info;
				levels.debug = levelSettings.debug;
				levels.error = levelSettings.error;
			};
			this.info = function (context, message, args) {
				if (levels.info) log('info', context, message, args);
			};
			this.warn = function (context, message, args) {
				if (levels.warn) log('warn', context, message, args);
			};
			this.error = function (context, message, args) {
				if (levels.error) log('error', context, message, args);
			};
			this.debug = function (context, message, args) {
				if (levels.debug) log('debug', context, message, args);
			};
		}]);
})();
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
(function () {
	angular.module('pleasantPastureApp')
		.component('inventory', {
			templateUrl: 'app/components/inventory/inventory.html',
			controller: InventoryController,
			controllerAs: 'inventoryController'
		});
})();

function InventoryController() {

}
(function(){
    angular.module('pleasantPastureApp')
        .service('peopleProvider', ['$q', 'firebase', 'firebaseArrayWatcher', 'logProvider', '$rootScope', function($q, firebase, firebaseArrayWatcher, logProvider, $rootScope){
            var self = this;

            var peopleLoadedPromise = $q.defer();
            this.people = firebaseArrayWatcher.getWatcher(firebase.people, peopleLoadedPromise);
            this.peopleLoaded = peopleLoadedPromise.promise;

            function setUserInfo(authInfo){
                logProvider.info('peopleProvider', 'authInfo provided to setUserInfo', authInfo);
                var userInfo = {
                    imgPath: authInfo.google.profileImageURL,
                    name: authInfo.google.displayName
                };
                logProvider.info('peopleProvider','userInfo from auth', userInfo);
                firebase.people.child(authInfo.uid).set(userInfo);
            };
            this.registerUser = function(){
                logProvider.info('peopleProvider', 'user being registered');
                firebase.root.unauth();
                firebase.root.authWithOAuthPopup('google', function (error, auth) {
                    if (!error){
                        logProvider.info('peopleProvider', 'user info retrieved from google', auth);
                        setUserInfo(auth);
                    }
                    else{
                        console.error('couldn\'t log the user in', error);
                    }
                });
            }
        }]);
})();
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