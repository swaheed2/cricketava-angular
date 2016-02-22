'use strict';

console.log('bootstrap.js');


angular.module('ui.bootstrap.demo', ['ui.bootstrap']);

angular.module('ui.bootstrap.demo').controller('AlertDemoCtrl',
  function($scope) {

      $scope.alerts = [
	  {type : 'danger', 
	   msg : 'Oh snap! Change a few things, re-submit'},
	  {type : 'success',
	   msg : 'Well done! You successfully read this alert'}
      ];

      $scope.addAlert = function() {
	  $scope.alerts.push({msg: 'Another alert!'});
      };

      $scope.closeAlert = function(index) {
	  $scope.alerts.splice(index, 1);
      };
	  
});

					       
