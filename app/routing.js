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