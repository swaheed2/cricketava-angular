myControllers.controller(
	'AuthCtrl', 

	function($scope, $location, UserService, $firebase,$firebaseAuth,AuthService,$q) {
		console.log("AuthCtrl")
		$scope.user = UserService; 
		$scope.auth = AuthService;

		$scope.email     = "";
		$scope.password  = "asdfasdf";
		$scope.confirmPassword = "asdfasdf";
		$scope.firstName = "Sumama";
		$scope.lastName  = "Waheed";
		$scope.teamName  = "PICC";   
		$scope.type  	 = "manager";
		$scope.under     = "managers";
		
		$scope.refString = "https://cricketava.firebaseio.com/data/teams/" + $scope.teamName;

		$scope.errors    = [$scope.refString];

		var ref = new Firebase($scope.refString);  
		$scope.Auth =  $firebaseAuth(ref); 
		init();
		function init(){
			$scope.Auth.$onAuth(authDataCallback); 
		}

		function authDataCallback(authData) {
			console.log("auth changed: " + authData);
			UserService.showLoader();	
			if(authData){
				$scope.authData = authData; 
				console.log("User " + authData.uid + " is logged in");
				AuthService.setLoggedIn(); 
				if(Object.keys(AuthService.getUserProfile()).length === 0){
					console.log("User data not set: " + JSON.stringify(AuthService.getUserProfile()));
					getUserData(ref,authData.uid, function(data){ 
						AuthService.setUserProfile(data);
						$scope.$broadcast('userDataSet');
						if(data.type === "manager"){
							$scope.changeView('manager'); 
						}else if(data.type === "treasurer"){
							$scope.changeView("treasurer");
						}else if(data.type === "player"){
							$scope.changeView("player")
						}else{
							$scope.changeView("/");
						}
						UserService.hideLoader();
						$scope.safeApply();
					});
				}
				else{
					console.log("User data already set: " + JSON.stringify(AuthService.getUserProfile()));
				}
			}
			else{
				UserService.hideLoader();
				$scope.safeApply();
			}
		}

		$scope.logout = function(){ 
			AuthService.clearData();
			$scope.Auth.$unauth();
			$scope.changeView('/');
		}

		$scope.logIn = function() {
			$scope.authData = null;
			$scope.error = null;
			UserService.showLoader();
			$scope.Auth.$authWithPassword({email:$scope.email,password:$scope.password}).then(function(authData) {
				$scope.authData = authData; 
			}).catch(function(error) {
				console.log(error)
			});
		};

		$scope.createUser = function(Auth) {
			UserService.showLoader();	
			console.log($scope.email)
			console.log("before validate")
			validateSignUp(function(errors) {  
				$scope.errors = errors; 
				$scope.safeApply();
				if($scope.errors.length == 0){
					Auth.$createUser({email:$scope.email,password:$scope.password}).then(function(userData) {
						var uid = userData.uid;
						console.log("User created with uid: " + JSON.stringify(userData,null,2)); 
						console.log(uid)
						var ref = new Firebase($scope.refString);   
						var teamRef = ref.child($scope.under).child(uid);
						var userData = {
							email    : $scope.email, 
							firstName: $scope.firstName,
							lastName : $scope.lastName,
							teamName : $scope.teamName, 
							type	 : $scope.type
						};  
						teamRef.set(userData);  
						console.log("User created with uid: " + uid); 
						UserService.hideLoader();
					}).catch(function(error) { 
						console.log(error.code);
						$scope.errors.push("Email address is already in use");
						UserService.hideLoader(); 
						$scope.safeApply();
					});
				}
				else{
					console.log("has errors");
					UserService.hideLoader();
					$scope.safeApply(); 
				}
			})

		}

		$scope.log = function(name,txt){
			console.log(name + ": " + txt)
		}

		function validateSignUp(cb)	{	
			var errors = [];
			var email = $scope.email; 
			if(email === undefined || email.length < 1){
				console.log(email)
				errors.push("Email is required")
			}
			else{
				var atpos = email.indexOf("@");
				var dotpos = email.lastIndexOf(".");
				if (atpos<1 || dotpos<atpos+2 || dotpos+2>=email.length) {
					errors.push("Not a valid e-mail address"); 
				}
			}
			var password = $scope.password;
			var confirmPassword = $scope.confirmPassword;
			if(password.length < 6){
				errors.push("Password's length should be 6 or more")
			}
			else if(password !== confirmPassword){
				errors.push("Passwords do not match")
			}
			if($scope.firstName.length < 2){
				errors.push("First name is required")
			}
			if($scope.lastName.length < 2){
				errors.push("Last name is required")
			}
			if($scope.teamName.length < 2){
				errors.push("Team name is required")
			}
			console.log("before team check");

			cb(errors);

			//			validateTeamName(function(valid) {
			//				console.log("after team check: " + valid);
			//				if(!valid){
			//					//errors.push("Team name already in use") 
			//				} 
			//				cb(errors);
			//				return;
			//
			//			})

		}

		function validateTeamName(cb) {
			var ref = new Firebase("https://cricketava.firebaseio.com/data/teams");  
			// Attach an asynchronous callback to read the data at our posts reference
			ref.on("value", function(result) {
				var teams = result.val();
				console.log(JSON.stringify(teams,null,2))
				for(var team in teams){
					if (teams.hasOwnProperty(team)) {
						console.log(team)
						if($scope.teamName == team){  
							cb(false);
							return;
						}
					}
				}  
				cb(true);
				return;
			},function (errorObject) {
				console.log("The read failed: " + errorObject.code);
				cb(false);
			}); 	
		};

		function getUserData(ref,uid,cb) {
			console.log("uid in getUserData: " + uid);
			var userData = {
				teamName: "",
				type  : "" 
			};
			var ref = new Firebase($scope.refString);
			console.log("gotten ref");
			ref.once("value", function(snapshot) {
				console.log("inside once");
				var teamName = snapshot.key(); 
				var teamData = snapshot.val();
				console.log("teamName: " + teamName); 
				//console.log("teamData: " + JSON.stringify(teamData,null,2)); 
				if(teamData.managers && teamData.managers[uid]){
					console.log("found in manager: " + teamName); 
					userData.type = "manager";  
					userData.teamName = teamName;
				}
				else if(teamData.treasurers && teamData.treasurers[uid]){
					userData.type = "treasurer";  
					userData.teamName = teamName;
				}
				else if(teamData.players && teamData.players[uid]){
					userData.type = "player";  
					userData.teamName = teamName;
				}
				else{
					console.log("skipping team: " + JSON.stringify(teamData,null,2));
				}

				console.log(JSON.stringify(userData,null,2));
				if(cb){
					console.log("callback getUserData about to be called");
					cb(userData);
					return;
				}

			}); 
		}

		$scope.safeApply = function(fn) {
			var phase = this.$root.$$phase;
			if(phase == '$apply' || phase == '$digest') {
				if(fn && (typeof(fn) === 'function')) {
					fn();
				}
			} else {
				this.$apply(fn);
			}
		};

		$scope.changeView = function(view){
			console.log("changing view: " + view);
			$location.path(view); // path not hash
			$scope.safeApply();
		} 


		$scope.safeApply = function(fn) { 
			if(this.$root && (this.$root.$$phase == '$apply' || this.$root.$$phase == '$digest') ) {
				if(fn && (typeof(fn) === 'function')) {
					fn();
				}
			}else {
				this.$apply(fn);
			}
		}; 


	} 
)

angular.module("myServices").factory(
	"AuthService",

	["UserService","$location",


	 function(UserService,$location){
		 console.log("Initialize Auth Service");		

		 var isLoggedIn = false;
		 var userProfile		= {}; 

		 // errros
		 firstNError = false;

		 var auth = {
			 isLoggedIn		:	function()	{	return isLoggedIn;				},
			 setLoggedIn	:	function()	{	isLoggedIn = true				},
			 setLoggedOut	:	function()	{	isLoggedIn = false				},
			 changeView 	:   function(view){
				 console.log("changing view: " + view);
				 $location.path(view); // path not hash 
				 angular.element(document.getElementById('mainView')).scope().safeApply();
			 },
			 safeApply		:   function() {
				 angular.element(document.getElementById('mainView')).scope().safeApply();
			 }, 
			 getFirstNError		:	function()	{	return firstNError			},
			 setFirstNError		:	function(e)	{	firstNError = e				} 

		 } 
		 auth.setUserProfile = function(d){
			 userProfile = d;
		 } 
		 auth.getUserProfile = function(){
			 return userProfile;
		 }

		 auth.clearProfile = function(){
			 isLoggedIn = false;
			 userProfile		= {}; 
		 }


		 return auth;


	 }]

)




