var app = angular.module('pleasantPastureApp', ['firebase', 'ui.router']);
app.run(['logProvider', function(logProvider){
    logProvider.setLoggingLevels({
        warn: true,
        error: true,
        debug: false,
        info: true
    });
}]);
var baseUrl = "pleasantpasture.firebaseio.com";

app.constant('firebase', {
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
app.config(function($stateProvider, $urlRouterProvider) {
	//
	// For any unmatched url, redirect to /state1
	$urlRouterProvider.otherwise("/");
	//
	// Now set up the states
	$stateProvider
		.state('home', {
			url: "/",
			templateUrl: "app/home/home.html"
		})
		.state('eggs', {
			url: "/eggs",
			templateUrl: "app/eggs/eggInfo.html",
		})
		.state('soap', {
			url: "/soap",
			templateUrl: "app/Soap/SoapInfo.html"
		})
		.state('chicken', {
			url: "/chicken",
			templateUrl: "app/chicken/chicken.html"
		})
		.state('map', {
			url: "/map",
			templateUrl: "app/map/map.html"
		})
});
app.directive("nav", [function () {
	return {
		restrict: 'E',
		templateUrl: 'app/nav/nav.html',
		controller: ['$scope', function($scope){}]
	}
}]);
app.controller('peopleController', ['$scope', 'peopleProvider', '$rootScope', 'activityProvider', 'logProvider', function ($scope, peopleProvider, $rootScope, activityProvider, logProvider) {
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
app.directive("testimonials", [function () {
	return {
		restrict: '',
		templateUrl: 'app/testimonials/testimonials.html',
		controller: ['$scope','firebase','firebaseArrayWatcher', function ($scope, firebase, firebaseArrayWatcher) {
			$scope.testimonials = firebaseArrayWatcher.getWatcher(firebase.testimonials.orderByChild('product').equalTo('soap'));
		}]
	}
}]);

app.directive("contactForm", [function () {
	return {
		restrict: 'E',
		templateUrl: 'app/forms/contact/contactForm.html',
		controller: ['$scope','firebase', function ($scope, firebase) {
			$scope.saved = false;
			$scope.contact = {};
			$scope.saveContact = function(){
				firebase.contacts.push($scope.contact, function(){
					$scope.saved = true;
					$scope.$digest();
				});
			};
		}]
	}
}]);
app.directive('focusWhen', function($timeout, $parse) {
    return {
        link: function(scope, element, attrs) {
            var model = $parse(attrs.focusWhen);
            scope.$watch(model, function(value) {
                if(value === true) {
                    $timeout(function() {
                        element[0].focus();
                    }, 100);
                }
            });
        }
    };
});
app.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if(event.which === 13) {
                scope.$apply(function(){
                    scope.$eval(attrs.ngEnter);
                });
                event.preventDefault();
            }
        });
    };
});
app.service('firebaseArrayWatcher', ['firebase', '$firebaseArray', 'logProvider', function(firebase, $firebaseArray, logProvider){
    var watchers = {};
    this.getWatcher = function(firebaseRef, promiseToResolve){
        if (!watchers[firebaseRef]){
            watchers[firebaseRef] = [];
            var fbArray = $firebaseArray(firebaseRef);
            if (promiseToResolve) {
                fbArray.$loaded(function(){
                    promiseToResolve.resolve();
                });
            }
            fbArray.$watch(function(args){
                //logProvider.debug('firebaseArrayWatcher', 'Got a firebase array event', args);
                if (args.event === firebase.events.childAdded){
                    watchers[firebaseRef].push(fbArray.$getRecord(args.key));
                }
                else if (args.event === firebase.events.childRemoved){
                    //logProvider.info('firebaseArrayWatcher', 'Removing array entry with key', args.key);
                    var removedItem = watchers[firebaseRef].find(function(activity){
                        return activity.$id == args.key;
                    });
                    watchers[firebaseRef].splice(watchers[firebaseRef].indexOf(removedItem), 1);
                }
            });
        }
        return watchers[firebaseRef];
    }
}]);
app.service("logProvider", ['firebase', function(firebase){
    var levels = {
        warn: false,
        info: false,
        debug: false,
        error: true
    };

    function log(level, context, message, args){
        var context = ((context) ? '[' + context + ']: ' : '');
        if (typeof args !== 'undefined') {
            console[level](context + message + ":", args);
        }
        else{
            console[level](context + message);
        }
    }

    this.setLoggingLevels = function(levelSettings){
        levels.warn = levelSettings.warn;
        levels.info = levelSettings.info;
        levels.debug = levelSettings.debug;
        levels.error = levelSettings.error;
    };
    this.info = function(context, message, args){
        if (levels.info) log('info', context, message, args);
    };
    this.warn = function(context, message, args){
        if (levels.warn) log('warn', context, message, args);
    };
    this.error = function(context, message, args){
        if (levels.error) log('error', context, message, args);
    };
    this.debug = function(context, message, args){
        if (levels.debug) log('debug', context, message, args);
    };
}]);
app.service('peopleProvider', ['$q', 'firebase', 'firebaseArrayWatcher', 'logProvider', '$rootScope', function($q, firebase, firebaseArrayWatcher, logProvider, $rootScope){
    var _this = this;

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
app.directive("map", [function () {
	return {
		restrict: 'E',
		templateUrl: 'app/global/content/map/map.html',
		controller: ['$scope', function ($scope) {

		}]
	}
}]);