'use strict';

/* App Module */

console.log("xyzzy: app.js: executing my app angular initialization");

var myApp = angular.module('myApp', [
	'ngRoute','myControllers','myServices','angular-gestures' ,'firebase', 'ngMaterial' 
])  


myApp.factory(
	"Auth", 
	["$firebaseAuth",
	 function($firebaseAuth) {
		 var ref = new Firebase("https://cricketava.firebaseio.com");
		 return $firebaseAuth(ref);
	 }]
);


myApp.run(["$rootScope", "$location", function($rootScope, $location) {
	console.log("myApp run")
	$rootScope.$on("$routeChangeError", function(event, next, previous, error) {
		// We can catch the error thrown when the $requireAuth promise is rejected
		// and redirect the user back to the home page
		if (error === "AUTH_REQUIRED") {
			console.log("not logged in");
			$location.path("/login");
		}
		else{
			console.log("whats happening");
		}
	});
}]); 


// configure our routes
myApp.config(function($routeProvider,hammerDefaultOptsProvider) {

	$routeProvider  
		.when('/', {
		templateUrl : 'views/home.html',
		controller  : 'MainCtrl',
		resolve: {
			"currentAuth": ["Auth", function(Auth) {
				return Auth.$waitForAuth();
			}]
		} 
	}).when('/login', {
		templateUrl : 'views/login.html',
		controller  : 'AuthCtrl'  
	}).when('/signup', {
		templateUrl : 'views/signup.html',
		controller  : 'AuthCtrl'  
	}).when('/password-reset', {
		templateUrl : 'views/password-reset.html',
		controller  : 'AuthCtrl'  
	}).when('/manager', {
		templateUrl : 'views/manager.html',
		controller  : 'ManagerCtrl',
		resolve: {
			"currentAuth": ["Auth", function(Auth) {
				return Auth.$requireAuth();
			}]
		}  
	}).when('/player', {
		templateUrl : 'views/player.html',
		controller  : 'PlayerCtrl'  
	}).when('/manager-signup', {
		templateUrl : 'views/manager-signup.html',
		controller  : 'AuthCtrl'  
	}).when('/player-signup', {
		templateUrl : 'views/player-signup.html',
		controller  : 'AuthCtrl'  
	});


	hammerDefaultOptsProvider.set({
		recognizers: [[Hammer.Swipe, {time: 250}]]
	});


});








var coax = require("coax"),
	fastclick = require("fastclick"),  
	config = {}

new fastclick.FastClick(document.body) 


