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
