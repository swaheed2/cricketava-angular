'use strict';

/* Controllers */

console.log("controllers.js");


var myControllers = angular.module('myControllers', []);



/*
  ============================================================
  id: Main Controller
  ============================================================
*/  

myControllers.controller('MainCtrl', function($scope, $location, UserService) {

	$scope.user = UserService;   



}); 


myControllers.controller('LoginCtrl', function($scope) {


	$scope.$on('$viewContentLoaded', function(){

	});
});





myControllers.controller('ManagerCtrl', function($scope,AuthService,UserService) {
	
	$scope.refString = "https://cricketava.firebaseio.com/data/teams/PICC";

	$scope.totalPlayers = 0; 

	$scope.isShowingGames = true;
	$scope.isShowingPlayers = false; 

	$scope.showGames = function(){
		$scope.isShowingGames = true;
		$scope.isShowingPlayers = false; 
	}
	$scope.showPlayers = function(){
		$scope.isShowingGames = false;
		$scope.isShowingPlayers = true; 
	}

	$scope.$on('userDataSet', function(){
		var ref = new Firebase($scope.refString);
		$scope.getPlayers(ref);
		$scope.getGames(ref); 
	});

	$scope.getPlayers = function(ref) {  
		var players = ref.child('players');
		players.once('value', function (dataSnapshot) { 
			var value = dataSnapshot.val();
			console.log(JSON.stringify(value,null,2));
			$scope.totalPlayers = Object.keys(value).length;
			$scope.players = value;
			AuthService.safeApply();
		},function (err) {
			console.log("error: " + errr);
		});
	}

	$scope.getGames = function(ref) {  
		var games = ref.child('games');
		games.once('value', function (snapshot) {
			$scope.games = snapshot.val(); 
			$scope.totalGames = Object.keys($scope.games).length;
			AuthService.safeApply();
		},function (err) {
			console.log("error: " + errr);
		});
	}

	$scope.addGame = function() { 
		var gameTime = "03-12-2016-09:00";
		var ref = new Firebase("https://cricketava.firebaseio.com/data/teams/" + AuthService.getUserProfile().teamName);   
		var gamesRef = ref.child('games').child(gameTime);
		var gameData = {
			date    :  "03-09-2016", 
			time	:  "09:00",
			venue 	:  "PCA7 - Russle Creek Plano",
			venueAddress : "3500 McDermott Rd, Plano, TX 75025", 
			homeGame	 : true,
			opponent	 : "Longhorns Kings"
		};  
		gamesRef.set(gameData, function(){ 
			$scope.getGames();
		});  

	}
});



