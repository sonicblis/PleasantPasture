(function () {
	angular.module('pleasantPastureApp')
		.component('store', {
			templateUrl: 'app/components/store/store.html',
			controller: ['stripeService', '$q', StoreController],
			controllerAs: 'storeController'
		});

	function StoreController(stripeService, $q) {
		var self = this,
			handler = null;

		function addItemToCart(item){
			var sku = item.skus.data[0],
				existingItem = self.cart.items.find(function(existingItem){ return sku.id === existingItem.id; });
			item.id = sku.id;
			item.price = sku.price;

			if (existingItem){
				incrementQuantity(existingItem);
			}
			else{
				item.quantity = 1;
				self.cart.items.push(item);
				calculateCartTotal();
			}
		}
		function removeItemFromCart(item){
			self.cart.items.splice(self.cart.items.indexOf(item), 1);
			calculateCartTotal();
		}
		function incrementQuantity(cartItem){
			cartItem.quantity++;
			calculateCartTotal();
		}
		function decrementQuantity(cartItem){
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
				console.log(total, cartItem);
				return total + (cartItem.static ? 0 : cartItem.quantity);
			}, 0);
			self.cart.total = total;
			self.cart.itemCount = cartItemCount;
		}
		function setInventoryToSelf(inventory){
			console.debug('got inventory', inventory);
			return $q(function (resolve, reject) {
				self.inventory = inventory;
				resolve(inventory);
			});
		}
		function payForOrder(){
			blockShippingSelection()
				.then(blockPayment)
				.then(getToken)
				.then(function(token){
					return stripeService.chargeCard(token, self.order);
				})
				.then(notifyOfSuccess)
				.catch(console.error)

		}
		function getToken(){
			return $q(function (resolve, reject) {
				stripeService.createToken(self.cardInfo, resolve);
			});
		}
		function notifyOfSuccess(){
			return $q(function (resolve) {
				self.selectedShippingOption = false;
				self.paying = false;
				self.selectedShippingOption = null;
				self.shippingOptions = [];
				self.checkingOut = false;
				self.checkoutSuccessful = true;
				resolve();
			});
		}
		function getShippingOptions(){
			addCartItemsToOrder()
				.then(stripeService.creatOrder)
				.then(setOrderToSelf)
				.then(setShippingOptionsToSelf);
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
		function setShippingOptionsToSelf(orderInfo){
			return $q(function (resolve, reject) {
				self.shippingOptions = orderInfo.shipping_methods;
				resolve(self.shippingOptions);
			});
		}
		function setOrderToSelf(order){
			return $q(function (resolve, reject) {
				self.order = order;
				resolve(order);
			});
		}
		function addShippingToCart(shippingOption){
			return $q(function (resolve, reject) {
				var previouslySelectedShipping = self.cart.items.find(function(item){
					return item.shippingItem == true;
				});
				if (previouslySelectedShipping){
					self.cart.items.splice(self.cart.items.indexOf(previouslySelectedShipping), 1);
				}
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
		function setSelectedShippingMethodToScope(shippingOption){
			return $q(function (resolve, reject) {
				self.selectedShippingOption = shippingOption;
				resolve(shippingOption);
			});
		}
		function updateOrderWithSelectedShipping(shippingOption){
			return $q(function (resolve, reject) {
				self.order.selected_shipping_method = shippingOption.id;
				resolve(self.order);
			});
		}
		function blockShippingSelection(option){
			return $q(function (resolve, reject) {
				self.updatingShipping = true;
				resolve(option);
			});
		}
		function blockPayment(){
			return $q(function (resolve) {
				self.paying = true;
				resolve();
			});
		}
		function unblockShippingSelection(){
			return $q(function (resolve, reject) {
				self.updatingShipping = false;
				resolve();
			});
		}
		function selectShipping(option){
			blockShippingSelection(option)
				.then(addShippingToCart)
				.then(setSelectedShippingMethodToScope)
				.then(updateOrderWithSelectedShipping)
				.then(stripeService.updateOrder)
				.then(setOrderToSelf)
				.then(unblockShippingSelection)
				.catch(console.error);
		}

		self.inventory = [];
		self.cart = {
			total: 0,
			itemCount: 0,
			items: []
		};
		self.checkingOut = false;
		self.updatingShipping = false;
		self.paying = false;
		self.selectedShippingOption = null;
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
		self.shippingOptions = [{description: 'Priority Plus Mail and Stuff', amount: 546, delivery_estimate: {type: 'exact', date: new Date()}}, {description: 'Priority Plus Mail and Stuff', amount: 546, delivery_estimate: {type: 'exact', date: new Date()}}];
		self.yearOptions = [];
		self.addItem = addItemToCart;
		self.increment = incrementQuantity;
		self.decrement = decrementQuantity;
		self.payForOrder = payForOrder;
		self.getShippingOptions = getShippingOptions;
		self.selectShipping = selectShipping;

		//init
		stripeService.getInventory()
			.then(setInventoryToSelf)
			.catch(console.error);

		var thisYear = new Date().getFullYear(),
			year = thisYear;
		for (var i = 0; i < 8; i++){
			self.yearOptions.push(year++);
		}
	}
})();
