'use strict';

/*
  SyncService
*/

console.log('sync.js');

angular.module('myServices').factory
(
	'SyncService', 

	[ 'UserService',

	 function(UserService) { 

		 var message = "Initial Sync. Please Wait...";


		 var iniSync = function(res, cb) {
			 console.log("ini sync method");
			 trigSync();
			 $('#spinnerAlert').hide();    // the red network error alert
			 var initialRes = res;         // save the res
			 var changesID = 0;            // for triversing through all_tasks res array
			 var waitForResponse = false;  // wait for res before sending next request, like a semaphore :) 
			 $('#spinnerMessage').show();

			 //ini dial knob
			 $(".dial").knob(); 
			 $('.dial').val(0).trigger('change'); 
			 $('.dial').trigger('configure', {"fgColor":"#1209eb", "inputColor":"#1209eb"});
			 var progress = 0;

			 // check for wifi, 3g, or 4g connection using helper-method.js
			 if(isGoodConnection()){
				 config.db.changes({since : config.info.update_seq}, function(err, change){ // when db changes
					 var lastSeq = change.seq
					 console.log("change:" + JSON.stringify(change,2,null) + "  err: " + JSON.stringify(err,2,null)) 
					 if($('#sync-spinner').is(":hidden")){
						 $('#sync-spinner').show();
						 setTimeout(function() { 
							 $('#sync-spinner').hide(); 
						 }, 5000);
					 }
					 window.dbChanged();


					 // update the document to change completed = true


					 /*if(!waitForResponse){ // if not waiting for a previous response
						 waitForResponse = true;  // now wait 
						 config.s.get("_active_tasks", function(err, res){  // get current sync tasks
							 waitForResponse = false; // got the result, release the lock 
							 console.log(JSON.stringify(res, null, 2));   
							 // if res is not empty && current object in array is not idle && ArrayIndex not out of bound
							 if(res.length >= 1 && res[changesID].status != "idle" && res.length > changesID){ 
								 $('.spinner').show(); // show circular spinner
								 if(res[changesID].change_count > 0){  // check if the current object has a change_count 
									 progress = Math.floor((res[changesID].completed_change_count/res[changesID].change_count)*100);
									 console.log("progress: " + progress);
									 $('.dial').val(progress).trigger('change');
								 }
								 else{ //current object didn't have a change_count, so go to next index
									 changesID++;
									 if(changesID >= res.length)  // if there is not a next index, go to index 0
										 changesID = 0;
								 }
								 if(progress == 100){  // finished 
									 $('#spinnerMessage').html('Optimizing');
									 $('.dial').trigger('configure', {"fgColor":"#2eba1c", "inputColor":"#075001"});
									 $('.dial').val(25).trigger('change');
									 allCustomers(true,function(t) {                 // run all methods that query views for optimization
										 $('.dial').val(40).trigger('change');
										 UserService.setTCustomers(t); 
										 allOrders(true, function(t){
											 $('.dial').val(65).trigger('change');
											 UserService.setTOrders(t); 
											 ordersByCustomer(true, function(){
												 $('.dial').val(80).trigger('change');
												 ordersByDate('2019-06-11 0:0:0', true, function(){
													 $('.dial').val(90).trigger('change');
													 contactsByCustomer(true, function(){
														 $('.dial').val(95).trigger('change');
														 var param = {rev : initialRes.rev }
														 var data = {completed : true}
														 // update the document to change completed = true
														 config.db.put(["_local/InitialSync", param ], data ,  function(err, res) {
															 console.log("res: " + JSON.stringify(res, null, 2)); 
															 var scope = angular.element(document.getElementById('syncView')).scope();
															 $('.spinner').hide();
															 $('#spinnerMessage').hide(); 
															 if(cb){cb();}
															 scope.changeView('home');
														 })
													 }); 
												 });
											 })
										 }) 
									 }) 
								 } 
							 }
							 // if there is not a next index, go to index 0
							 else if(res.length >= 1 && res[changesID].status == "idle"){ 
								 changesID++;
								 if(changesID >= res.length)
									 changesID = 0;
								 console.log("changesID: " + changesID);
							 }
							 // im done
							 else{
								 $('.spinner').hide();
								 $('#spinnerMessage').hide();
							 }

						 })
					 }*/ 
					 window.dbChanged();
				 })

			 }
			 else{
				 $('#loader').hide();
				 $('#spinnerAlert').html('<div class="row" style="margin:10px;"><div class="col col-md-12 callout callout-danger"><h4>You have a slow or unrelaiable network connection. Please connect to WIFI and try again. </h4></div><div class="col-md-12"><button class="btn btn-default btn-lg" onclick="connectToChanges()">Try Again </div></div>');
				 $('#spinnerAlert').show();
			 } 
		 }; 

		 /*
				Sync Manager: this is run on first login, and on every app boot after that.

				The way it works is with an initial single push replication. When that
				completes, we know we have a valid connection, so we can trigger a continuous
				push and pull

			*/

		 var trigSync = function(cb, retryCount) {
			 console.log("config: " + JSON.stringify(config));
			 var remote = {
				 url : config.site.syncUrl 
				 //auth : {facebook : {email : config.user.email}} // why is this email?
			 },
				 push = {
					 source : appDbName,
					 target : remote,
					 continuous : true
				 }, 
				 pull = {
					 target : appDbName,
					 source : remote,
					 continuous : true
				 },

				 pushSync = syncManager(config.server, push),
				 pullSync = syncManager(config.server, pull)

			 log("pushSync", push)

			 if (typeof retryCount == "undefined") {
				 retryCount = 3
			 }

			 var hasNetwork = false;
			 function networkError() {
				 if (!hasNetwork) {return}
				 hasNetwork = false;
				 pushSync.cancel(function(err, ok) {
					 pullSync.cancel(function(err, ok) {
						 if (retryCount == 0) {return cb("sync retry limit reached")}
						 retryCount--
						 console.log("network error");
					 })
				 })
			 }

			 /*	pushSync.on("network-error", networkError)
					pullSync.on("network-error", networkError)
				*/

			 pushSync.on("error", function(err){
				 //if (challenged) {return}
				 if (!hasNetwork) {return}
				 cb(err)
			 })
			 pushSync.on("connected", function(){
				 pullSync.start()
			 })
			 pullSync.on("error", function(err){
				 //if (challenged) {return}
				 if (!hasNetwork) {return}
				 cb(err)
			 })
			 pullSync.on("connected", function(){
				 //cb()
			 })
			 // setTimeout(function(){
			 pushSync.start()
			 // }, 10000) 
		 }; 
		 /*
				Sync manager module TODO extract to NPM
			*/ 
		 var syncManager = function (serverUrl, syncDefinition) {
			 var handlers = {}

			 function callHandlers(name, data) {
				 (handlers[name]||[]).forEach(function(h){
					 h(data)
				 })
			 }

			 function doCancelPost(cb) {
				 var cancelDef = JSON.parse(JSON.stringify(syncDefinition))
				 cancelDef.cancel = true
				 coax.post([serverUrl, "_replicate"], cancelDef, function(err, info){
					 if (err) {
						 callHandlers("error", err)
						 if (cb) {cb(err, info)}
					 } else {
						 callHandlers("cancelled", info)
						 if (cb) {cb(err, info)}
					 }
				 })
			 }

			 function doStartPost() {
				 var tooLate;
				 function pollForStatus(info, wait) {
					 if (wait) {
						 setTimeout(function() {
							 tooLate = true
						 }, wait)
					 } 
					 callHandlers("connected", []);
					 if (!tooLate) {
						 setTimeout(function() {
							 pollForStatus(info)
						 }, 200)
					 } 
					 else if (tooLate) {
						 callHandlers("error", "timeout")
					 } 
				 }

				 var callBack;
				 if (syncDefinition.continuous) {
					 // auth errors not detected for continuous sync
					 // we could use _active_tasks?feed=continuous for this
					 // but we don't need that code for this app...
					 callBack = function(err, info) { 
						 if (err) { 
							 log("continuous sync callBack", err, info, syncDefinition)
							 callHandlers("error", err) 
						 } else {
							 pollForStatus(info, 10000)
							 callHandlers("started", info)
						 }
					 }
				 } else { // non-continuous
					 callBack = function(err, info) {
						 log("sync callBack", err, info, syncDefinition)
						 if (err) {
							 if (info.status == 401) {
								 err.status = info.status;
								 callHandlers("network-error", err)
							 } else {
								 err.status = info.status;
								 callHandlers("error", err)
							 }
						 } else {
							 callHandlers("connected", info)
						 }

					 }
				 }
				 //log("start sync"+ JSON.stringify(syncDefinition))
				 coax.post([serverUrl, "_replicate"], syncDefinition, callBack) 
			 }


			 var publicAPI = {
				 start : doStartPost,
				 cancel : doCancelPost,
				 on : function(name, cb) {
					 handlers[name] = handlers[name] || []
					 handlers[name].push(cb)
				 }
			 }
			 return publicAPI;
		 };

		 var connectToChanges = function(cb) {
			 window.dbChanged = function(){}

			 $('#loader').show();
			 var params = {
				 "completed": false
			 }
			 config.db.get("_local/InitialSync",  function(err, res) {   // try to get the InitialSync document
				 console.log("res: " + JSON.stringify(res, null, 2));
				 if(err || !res.completed){   // if not found 
					 config.db.put("_local/InitialSync", params, function(err, res) {  // create it and run iniSync
						 if(!err){
							 console.log("InitialSync Created"); 
							 var param = {rev : res.rev }
							 var data = {completed : true}
							 config.db.put(["_local/InitialSync", param ], data ,  function(err, res) {
								 console.log("res: " + JSON.stringify(res, null, 2)); 

							 })
							 iniSync(res, cb);
						 } 
					 }) 
				 } 
				 else{ // if document was already created , hide spinner
					 console.log("Not Initial");
					 $('.spinner').hide();
					 if(cb){cb();}
					 var scope = angular.element(document.getElementById('syncView')).scope(); 
					 scope.changeView('home'); 
				 }
			 })  
		 };

		 var goIndex = function () {

			 window.dbChanged = function(){
				 console.log("dbchanged!")
				 config.db.changes({since : config.info.update_seq}, function(err, change){ // when db changes				
					 var lastSeq = '';
					 if(change){
						 lastSeq = change.seq
					 }

					 console.log("change: " + config.info.update_seq + " " + JSON.stringify(change,2,null) + "  err: " + JSON.stringify(err,2,null)) 

					 $('#sync-spinner').show();
					 setTimeout(function() { 
						 $('#sync-spinner').hide(); 
					 }, 5000); 
				 })  
			 }
			 //window.dbChanged();
		 }
		 /*
			   ============================================================
			   Public Interface
			   ============================================================
			*/

		 var sync = { 

			 getMessage  : function()  	  {  return message();		      }, 
			 setMessage  : function(mes)  {  message = mes;			      }, 

			 runIniSync  : function()     {  return iniSync();		      },

			 getChanges  : function(cb)	  {  return connectToChanges(cb); },

			 triggerSync : function()     {  return trigSync();           },
			 getIndex    : function()     {  return goIndex();            }
		 };

		 console.log('initializing SyncService');
		 return sync;

	 }]

)