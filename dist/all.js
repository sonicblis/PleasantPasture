(function(){
    angular.module('pleasantPastureApp', ['firebase', 'ui.router'])
        .run(['logProvider', '$rootScope', '$state', '$http', 'envService', '$location', function(logProvider, $rootScope, $state, $http, envService, $location){
            logProvider.setLoggingLevels({
                warn: true,
                error: true,
                debug: true,
                info: true
            });

            $http.get('app/env.json')
                .then(function(result){
                    var host = $location.host().replace('www.', '').replace('.com','').toLowerCase(),
                        relevantEnv = result.data[host];

                    if (relevantEnv.STRIPE_PUBLIC_KEY) {
                        envService.setStripePublicKey(relevantEnv.STRIPE_PUBLIC_KEY);
                    }
                    else{
                        throw new Error('The stripe public key could not be retrieved.  Make sure you have an env.json file configured.');
                    }

                    if (relevantEnv.PLEASANTPASTURE_API_URL){
                        envService.setPleasantPastureAPIUrl(relevantEnv.PLEASANTPASTURE_API_URL);
                    }
                    else{
                        throw new Error('The pleasant pasture url could not be retrieved.  Make sure you have an env.json file configured.');
                    }
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
		.component('inventory', {
			templateUrl: 'app/components/inventory/inventory.html',
			controller: InventoryController,
			controllerAs: 'inventoryController'
		});

	function InventoryController() {

	}
})();

(function () {
	angular.module('pleasantPastureApp')
		.component('store', {
			templateUrl: 'app/components/store/store.html',
			controller: ['stripeService', '$q', '$rootScope', storeController],
			controllerAs: 'storeController'
		});

	function storeController(stripeService, $q, root) {
		var self = this,
			pickupShippingOption = {
				"id": "pickup",
				"amount": 0,
				"currency": "usd",
				"delivery_estimate": {
					"type": "exact"
				},
				"description": "Pick it up"
			};

		function notifyOfSuccess(){
			return $q(function (resolve) {
				self.selectedShippingOption = false;
				self.paying = false;
				self.selectedShippingOption = null;
				self.shippingOptions = [];
				self.selectingShipping = false;
				self.checkoutSuccessful = true;
				resolve();
			});
		}
		function startProcessing(){
			return $q(function (resolve, reject) {
				root.processing = true;
				resolve();
			});
		}
		function stopProcessing(){
			return $q(function (resolve, reject) {
				root.processing = false;
				resolve();
			});
		}

		//cart
		function addItemToCart(item){
			var sku = item.skus.data[0],
				existingItem = self.cart.items.find(function(existingItem){ return sku.id === existingItem.id; });

			if (sku.inventory.quantity > 0) {
				item.id = sku.id;
				item.price = sku.price;

				if (existingItem) {
					incrementQuantity(existingItem);
				}
				else {
					item.quantity = 1;
					self.cart.items.push(item);
					calculateCartTotal();
				}

				sku.inventory.quantity--;
				enableCheckOut();
			}
		}
		function removeItemFromCart(item){
			self.cart.items.splice(self.cart.items.indexOf(item), 1);
			calculateCartTotal();
			if (self.cart.total == 0){
				disableCheckOut();
			}
		}
		function incrementQuantity(cartItem){
			cartItem.quantity++;
			calculateCartTotal();
		}
		function decrementQuantity(cartItem){
			cartItem.skus.data[0].inventory.quantity++;
			if (cartItem.quantity === 1){
				removeItemFromCart(cartItem);
			}
			else {
				cartItem.quantity--;
				calculateCartTotal();
			}
		}
		function calculateCartTotal(){
			var total = self.cart.items.reduce(function(total, cartItem){
				return total + ((cartItem.price / 100) * cartItem.quantity);
			}, 0);
			var cartItemCount = self.cart.items.reduce(function(total, cartItem){
				return total + (cartItem.static ? 0 : cartItem.quantity);
			}, 0);
			self.cart.total = total;
			self.cart.itemCount = cartItemCount;
		}
		function disableCheckOut(){
			return $q(function (resolve, reject) {
				self.canCheckOut = false;
				resolve();
			});
		}
		function enableCheckOut(){
			return $q(function (resolve, reject) {
				self.canCheckOut = true;
				resolve();
			});
		}
		function continueShopping(){
			self.shopping = true;
			self.checkoutSuccessful = false;
			resetOrder()
				.then(function(){
					self.cart.items = [];
					self.cart.total = 0;
					self.cart.itemCount = 0;
				})
		}

		//products
		function setInventoryToSelf(inventory){
			return $q(function (resolve, reject) {
				self.inventory = inventory;
				resolve(inventory);
			});
		}
		function orderByAttribute(inventory){
			return $q(function (resolve, reject) {
				inventory.sort(function(first, second){
					return parseInt(first.metadata.order) - parseInt(second.metadata.order);
				});
				resolve(inventory);
			});
		}

		//order
		function cancelAnyPreviousOrder(){
			return $q(function (resolve, reject) {
				self.order.items = [];
				if (self.order.id) {
					self.canPay = false;
					stripeService.cancelOrder(self.order)
						.then(resetOrder)
						.then(resolve);
				}
				else{
					resolve();
				}
			});
		}
		function resetOrder(){
			return $q(function (resolve, reject) {
				var existingShippingInfo = self.order.shipping.address,
					existingEmail = self.order.email,
					existingName = self.order.shipping.name;

				self.order = {currency: 'usd',
					items: [],
					shipping: {
						address:
						{
							line1: existingShippingInfo.line1,
							line2: existingShippingInfo.line2,
							postal_code: existingShippingInfo.postal_code,
							country: 'US'
						},
						name: existingName
					}
				};
				self.order.email = existingEmail;
				resolve();
			});
		}
		function handleOrderCreateError(response){
			return $q(function (resolve, reject) {
				stopProcessing()
					.then(function(){
						if (response.code == 'out_of_inventory'){
							self.createOrderError = "One or more items are out of stock";
						}
						else if (response.data.code == 'shipping_calculation_failed') {
							self.createOrderError = "We could not find your address";
						}
						else{
							self.createOrderError = 'Something went wrong finding shipping options.  You may want to start over.';
						}
					})
					.catch(console.error);
				reject('bad address');
			});
		}
		function addCartItemsToOrder(){
			return $q(function (resolve, reject) {
				self.cart.items.forEach(function(cartItem){
					self.order.items.push({
						type: 'sku',
						quantity: cartItem.quantity,
						parent: cartItem.id
					})
				});
				resolve(self.order);
			});
		}
		function setOrderToSelf(order){
			return $q(function (resolve, reject) {
				self.order = order;
				resolve(order);
			});
		}
		function clearPreviousOrderCreationError(){
			return $q(function (resolve, reject) {
				self.createOrderError = null;
				resolve();
			});
		}

		//shipping
		function fixCrappyShippingOptions(orderInfo){
			//weirdly, shipping options come back with many weird suggestions
			//like paying $20 for days later than the $5 option
			var shippingOptions = orderInfo.shipping_methods;
			return $q(function (resolve, reject) {
				var sortedOptions = shippingOptions.sort(function(first, second){
					var firstDate = new Date(first.delivery_estimate.date || first.delivery_estimate.earliest),
						secondDate = new Date(second.delivery_estimate.date || second.delivery_estimate.earliest);
					return secondDate - firstDate;
				});
				for (var i = 1; i < sortedOptions.length; i++){
					for (var j = 0; i > j; j++) {
						if (sortedOptions[i].amount < sortedOptions[j].amount) {
							sortedOptions[j].ridiculous = true;
						}
					}
				}
				resolve(sortedOptions.filter(function(option){ return !option.ridiculous; }));
			});
		}
		function addTwoDaysToShippingDates(shippingOptions){
			return $q(function (resolve, reject) {
				shippingOptions.forEach(function(option){
					var expectedDate = new Date(option.delivery_estimate.date || option.delivery_estimate.earliest);
					expectedDate.setDate(expectedDate.getDate() + 3);

					option.delivery_estimate.date = expectedDate;
					option.delivery_estimate.earliest = expectedDate;

					if (option.delivery_estimate.latest){
						var latest = new Date(option.delivery_estimate.latest);
						option.delivery_estimate.latest = latest.setDate(latest.getDate() + 3);
					}
				});
				resolve(shippingOptions);
			});
		}
		function addPickupShippingOption(shippingOptions){
			return $q(function (resolve, reject) {
				var pickupDate = new Date();
				pickupDate.setDate(pickupDate.getDate() + 1);
				pickupShippingOption.delivery_estimate.date = pickupDate;
				shippingOptions.push(pickupShippingOption);
				self.order.shipping_methods.push(pickupShippingOption);
				resolve(shippingOptions);
			});
		}
		function unblockShippingSelection(){
			return $q(function (resolve, reject) {
				self.updatingShipping = false;
				resolve();
			});
		}
		function blockShippingSelection(option){
			return $q(function (resolve, reject) {
				self.updatingShipping = true;
				resolve(option);
			});
		}
		function updateOrderWithSelectedShipping(shippingOption){
			return $q(function (resolve, reject) {
				self.order.selected_shipping_method = shippingOption.id;
				resolve(self.order);
			});
		}
		function setSelectedShippingMethodToScope(shippingOption){
			return $q(function (resolve, reject) {
				self.selectedShippingOption = shippingOption;
				resolve(shippingOption);
			});
		}
		function setShippingOptionsToSelf(shippingMethods){
			return $q(function (resolve, reject) {
				self.shippingOptions = shippingMethods;
				resolve(self.shippingOptions);
			});
		}
		function setAddressValid(){
			return $q(function (resolve, reject) {
				self.addressError = false;
				resolve();
			});
		}
		function getShippingOptions(){
			startProcessing()
				.then(clearPreviousOrderCreationError)
				.then(cancelAnyPreviousOrder)
				.then(removePreviousShippingOptions)
				.then(addCartItemsToOrder)
				.then(stripeService.creatOrder)
				.then(setOrderToSelf, handleOrderCreateError)
				.then(fixCrappyShippingOptions)
				.then(addTwoDaysToShippingDates)
				//.then(addPickupShippingOption)
				.then(setShippingOptionsToSelf)
				.then(setAddressValid)
				.then(stopProcessing)
				.catch(console.error);
		}
		function removePreviousShippingOptions(){
			return $q(function (resolve, reject) {
				self.shippingOptions = [];
				self.selectedShippingOption = null;
				removeShippingFromCart()
					.then(resolve)
					.catch(console.error);
			});
		}
		function removeShippingFromCart(){
			return $q(function (resolve, reject) {
				var previouslySelectedShipping = self.cart.items.find(function(item){
					return item.shippingItem == true;
				});
				if (previouslySelectedShipping){
					self.cart.items.splice(self.cart.items.indexOf(previouslySelectedShipping), 1);
				}
				resolve();
			});
		}
		function addShippingToCart(shippingOption){
			return $q(function (resolve, reject) {
				self.cart.items.push({
					name: shippingOption.description,
					price: shippingOption.amount,
					quantity: 1,
					static: true, //prevents the plus/minus buttons
					shippingItem: true
				});
				calculateCartTotal();
				resolve(shippingOption);
			});
		}
		function selectShipping(option){
			blockPayment()
				.then(blockShippingSelection)
				.then(removeShippingFromCart)
				.then(function() { return addShippingToCart(option); })
				.then(setSelectedShippingMethodToScope)
				.then(updateOrderWithSelectedShipping)
				.then(stripeService.updateOrder)
				.then(setOrderToSelf)
				.then(unblockShippingSelection)
				.then(allowPayment)
				.then(disableCheckOut)
				.catch(console.error);
		}
		function cancelShipping(){
			self.canCheckOut = true;
			self.canPay = false;
			self.selectingShipping = false;
			self.shopping = true;
			removeShippingFromCart();
		}

		//payment
		function getToken(){
			return $q(function (resolve, reject) {
				stripeService.createToken(self.cardInfo)
					.then(resolve)
					.catch(reject);
			});
		}
		function handleTokenFailure(error){
			return $q(function (resolve, reject) {
				self.paymentErrorMessage = error.message || error;
				stopProcessing()
					.then(allowPayment)
					.then(function(error){ reject(error); });
			});
		}
		function handleChargeFailure(error){
			return $q(function (resolve, reject) {
				self.paymentErrorMessage = (error && error.data && error.data.message) ? error.data.message : (error && error.message) ? error.message : 'There was an error charging your card.';
				stopProcessing()
					.then(allowPayment)
					.then(reject);
			});
		}
		function clearPreviousPaymentError(){
			return $q(function (resolve, reject) {
				self.paymentErrorMessage = null;
				allowPayment()
					.then(resolve);
			});
		}
		function payForOrder(){
			startProcessing()
				.then(clearPreviousPaymentError)
				.then(blockPayment)
				.then(getToken)
				.then(function(token){
					return stripeService.chargeCard(token, self.order);
				}, handleTokenFailure)
				.then(notifyOfSuccess, handleChargeFailure)
				.then(stopProcessing)
				.catch(console.error)
		}
		function blockPayment(){
			return $q(function (resolve) {
				self.canPay = false;
				self.processingPayment = true;
				resolve();
			});
		}
		function allowPayment(){
			return $q(function (resolve, reject) {
				self.canPay = true;
				self.processingPayment = false;
				resolve();
			});
		}
		function cancelPayment(){
			cancelAnyPreviousOrder()
				.then(removePreviousShippingOptions)
				.then(blockPayment)
				.then(enableCheckOut)
				.then(blockShippingSelection)
				.then(resetOrder)
				.then(function(){
					self.selectedShippingOption = false;
					self.paying = false;
					self.updatingShipping = false;
					self.shopping = true;
				})
				.catch(console.error);
		}

		self.inventory = [];
		self.cart = {
			total: 0,
			itemCount: 0,
			items: []
		};
		self.selectingShipping = false;
		self.updatingShipping = false;
		self.processingPayment = false;
		self.paying = false;
		self.shopping = true;
		self.canPay = false;
		self.selectedShippingOption = null;
		self.canCheckOut = false;
		self.order = {
			currency: 'usd',
			items: [],
			shipping: {
				address:
				{
					country: 'US'
				}
			}
		};
		self.shippingOptions = [];
		self.yearOptions = [];
		self.addressError = false;
		self.paymentErrorMessage = null;

		self.addItem = addItemToCart;
		self.increment = incrementQuantity;
		self.decrement = decrementQuantity;
		self.payForOrder = payForOrder;
		self.getShippingOptions = getShippingOptions;
		self.selectShipping = selectShipping;
		self.cancelOrder = cancelPayment;
		self.cancelShipping = cancelShipping;
		self.continueShopping = continueShopping;

		//init
		/*
		startProcessing()
			.then(stripeService.getInventory)
			.then(orderByAttribute)
			.then(setInventoryToSelf)
			.then(stopProcessing)
			.catch(console.error);
		*/

		var thisYear = new Date().getFullYear(),
			year = thisYear;
		for (var i = 0; i < 8; i++){
			self.yearOptions.push(year++);
		}
	}
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
(function () {
	angular.module('pleasantPastureApp')
		.service("envService", function () {
			var stripePublicKey = '';
			var pleasantPastureAPIUrl = '';

			this.setStripePublicKey = function(key){
				stripePublicKey = key;
			};
			this.setPleasantPastureAPIUrl = function(url){
				pleasantPastureAPIUrl = url;
			};
			this.getStripePublicKey = function(){
				if (stripePublicKey == '' || stripePublicKey == null || stripePublicKey == undefined){
					throw new Error('The Stripe public key was not set.  Make sure you have an env.json file in your environment.');
				}
				else{
					return stripePublicKey;
				}
			};
			this.getPleasantPastureAPIUrl = function(){
				if (pleasantPastureAPIUrl == '' || pleasantPastureAPIUrl == null || pleasantPastureAPIUrl == undefined){
					throw new Error('The pleasant pasture api url was not set.  Make sure you have an env.json file in your environment.');
				}
				else{
					return pleasantPastureAPIUrl;
				}
			};
		});
})();

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
(function(angular, stripe){
	angular.module('pleasantPastureApp')
		.service('stripeService', ['$q', '$http', 'envService', function($q, $http, envService){
			stripe.setPublishableKey(envService.getStripePublicKey());
			var apiBaseUrl = envService.getPleasantPastureAPIUrl();

			function getInventory() {
				return $q(function (resolve, reject) {
					$http.get(apiBaseUrl + 'products').then(function(result){
						resolve(result.data.data);
					});
				});
			}
			function chargeCard(token, order){
				return $q(function (resolve, reject) {
					$http.post(apiBaseUrl + 'charge', {
						token: token,
						orderId: order.id,
						email: order.email
					}).then(
						function(result){
							console.log('card charge success', result);
							resolve(result.data);
						},
						function(result){
							console.log('card charge error', result);
							reject(result);
						}
					);
				});
			}
			function createOrder(order){
				return $q(function (resolve, reject) {
					$http.post(apiBaseUrl + 'order', order)
						.then(
							function(result){ resolve(result.data); },
							function(result){ reject(result); }
						);
				});
			}
			function updateOrder(order){
				return $q(function (resolve, reject) {
					$http.put(apiBaseUrl + 'order', order)
						.then(
							function(result){ resolve(result.data); },
							function(result){ reject(result); }
						);
				});
			}
			function cancelOrder(order){
				return $q(function (resolve, reject) {
					$http.delete(apiBaseUrl + 'order/' + order.id)
						.then(
							function(result){ resolve(result.data); },
							function(result){ reject(result); }
						);
				});
			}
			function createToken(cardInfo){
				return $q(function (resolve, reject) {
					stripe.card.createToken(cardInfo, function(status, response){
						if (response.error){
							reject(response.error);
						}
						else{
							resolve(response.id);
						}
					});
				});
			}

			this.getInventory = getInventory;
			this.chargeCard = chargeCard;
			this.creatOrder = createOrder;
			this.updateOrder = updateOrder;
			this.createToken = createToken;
			this.cancelOrder = cancelOrder;
		}]
	)
})(angular, Stripe);

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