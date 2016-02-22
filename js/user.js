'use strict';


console.log('UserService.js');

angular.module('myServices').factory
(
	'UserService', 
	[ /*dependencies , */

		function() {

			 var isShowingLoader = false;

			/*
			============================================================
			   Public Interface
			============================================================
	    	*/

			var UserService = {

				isShowingLoader				: 	function() { return isShowingLoader;  			},
				showLoader					:   function() { isShowingLoader = true;			},
				hideLoader					: 	function() { isShowingLoader = false;			}
 
			};
 
			return UserService;
		}]
)
