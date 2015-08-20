function startNodemono() {
	//import CSS library
	importCSS(chrome.extension.getURL("css/bootstrap.min.css"))
		// importCSS(chrome.extension.getURL("sgadget/selectorgadget_combined.css"))
	importCSS(chrome.extension.getURL("css/style.css"));

	// importJS(chrome.extension.getURL('js/main.js'));

	$.get(chrome.extension.getURL('html/kimono-toolbar.html'), function(data) {

		//create a div with ngNonBindable property to prevent automatically bootstrap angular;
		var div = document.createElement('div');
		div.dataset.ngNonBindable = '';

		var appRoot = document.createElement('div');
		appRoot.dataset.ngController = 'NodemonoMainCtrl as ctrl';

		appRoot.id = "nodemonofy"
			// Insert elements into the DOM
			// document.body.pre(div);
		$(div).prependTo('body')
		div.appendChild(appRoot);
		$(data).appendTo('#nodemonofy');

		window.app = angular
			.module('myApp', ['ngAnimate']);
		registerAuthService();
		app
			.factory("Route", function($http, AUTH_EVENTS) {
				function Route(props) {
					angular.extend(this, props);
					return this;

				};

				Route.serverUrl = '/api/routes/';

				Object.defineProperty(Route.prototype, 'serverUrl', {
					get: function() {
						return AUTH_EVENTS.serverUrl + Route.serverUrl;
					}
				})
				Route.prototype.isNew = function() {
					return !this._id
				};

				Route.prototype.fetch = function() {
					return $http.get(this.serverUrl)
						.then(function(res) {
							return res.data;
						})
				};

				Route.prototype.save = function() {
					var verb
					var serverUrl
					if (this.isNew()) {
						verb = 'post'
							// serverUrl = Route.serverUrl
					} else {
						verb = 'put'
					}
					serverUrl = this.serverUrl
					return $http[verb](serverUrl, this)
						.then(function(res) {
							return res.data
						})
				}
				Route.prototype.destroy = function() {
					return $http.delete(this.serverUrl)
				}
				return Route;
			})
			.controller('NodemonoMainCtrl', function($scope) {
				console.log('go here')
			})
			.controller('ToolbarCtrl', function MyCtrl($scope, $rootScope) {
				$rootScope.showCollectionOverlay = false;
				$scope.currentProperty = {};


				//set up the route object for this webpage
				$rootScope.apiRoute = {};
				$rootScope.apiRoute.data = [];

				$scope.getPagination = function() {

				}
				$scope.doneClicked = function() {
						$rootScope.showCollectionOverlay = $rootScope.showCollectionOverlay === true ? false : true;
				}

				//preview crawl data from selector user choose;
				$scope.previewData = function(){
					$rootScope.showPreviewData = $rootScope.showPreviewData === true ? false : true;
				}	
					//cancel 
				$scope.cancel = function() {
					//reset currentProperty
					$scope.currentProperty = {};

					//change stylings on DOM
					for (var i = 0; i < $scope.matchList.length; i++) {
						$scope.matchList[i].style['background-color'] = 'yellow';
					}
					$scope.targetElement.style['background-color'] = '#00ff00';

					//hide/show toolbar
					hideAllElms();
					setTimeout(function() {
						document.getElementById('oneButton').className = 'toolbarEl show';
						document.getElementById('allButton').className = 'toolbarEl show';
					}, 100)

					//allow clicks on webpage
					$scope.overlay.id = '';
				}


				//chose 'One'
				$scope.oneBtnClick = function() {

					//set properties of the currentProperty
					$scope.currentProperty['selector'] = $scope.selector;
					$scope.currentProperty['indecies'] = [$scope.matchList.indexOf($scope.targetElement)];
					console.log($scope.currentProperty['indecies']);

					//change stylings on DOM
					resetHighlights($scope);
					$scope.targetElement.style['background-color'] = '#00ff00';

					//hide/show toolbar elements
					hideAllElms();
					generateAttrButtons('green', $scope);
					setTimeout(function() {
						document.getElementById('backButton').className = 'toolbarEl show'
						var attrSelectors = document.getElementById('attrSelectors');
						console.log(attrSelectors);
						for (var i = 0; i < attrSelectors.children.length; i++) {
							attrSelectors.children[i].className = 'greenAttr show'
							console.log(attrSelectors[i])
						}
					}, 100);

					//block clicks on webpage
					$scope.overlay.id = 'cover';
				}

				//chose 'All'
				$scope.allBtnClick = function() {
					//set currentProperty
					$scope.currentProperty['selector'] = $scope.selector;
					$scope.currentProperty['indecies'] = [];

					//change stylings on DOM
					$scope.targetElement.style['background-color'] = '#ffff00'

					//hide/show toolbar elements
					hideAllElms();
					generateAttrButtons('yellow', $scope);
					setTimeout(function() {
						document.getElementById('backButton').className = 'toolbarEl show'
						var attrSelectors = document.getElementById('attrSelectors');
						for (var i = 0; i < attrSelectors.children.length; i++) {
							attrSelectors.children[i].className = 'yellowAttr show'
						}
					}, 100);

					//block all clicks on webpage
					$scope.overlay.id = 'cover';

				}

				//chose desired attribute
				$scope.selectedAttr = function(attr) {
					//set currentProperty
					$scope.currentProperty['attr'] = attr;

					//hide/show toolbar elements
					hideAllElms();
					setTimeout(function() {
						document.getElementById('backButton').className = 'toolbarEl show'
						document.getElementById('saveBtn').className = 'toolbarEl show'
						document.getElementById('nameInput').className = 'toolbarEl show'
					}, 100);
				}

				$scope.save = function() {

					//save the property to this route
					$rootScope.apiRoute.data.push($scope.currentProperty);
					console.log($rootScope.apiRoute);
					//reset the DOM

					//change stylings on DOM
					resetHighlights($scope);

					//hide/show toolbar elements
					hideAllElms();

					//allow clicks on webpage
					$scope.overlay.id = '';

					//create a new button to show chosen properties
					var newButton = document.createElement('button');
					newButton.className = 'show selectorBtn'
					newButton.dataProp = $scope.currentProperty
					if (newButton.dataProp.indecies.length > 0) {
						newButton.innerHTML = newButton.dataProp.indecies.length;
					} else {
						var list = document.querySelectorAll(newButton.dataProp.selector);
						newButton.innerHTML = list.length;
					}
					newButton.addEventListener('click', function(event) {
						var button = event.target || event.srcElement;
						hideAllElms();
						resetHighlights($scope);
						$scope.matchList = document.querySelectorAll(button.dataProp.selector)
						var indecies = button.dataProp.indecies
						if (indecies.length > 0) {
							for (var i = 0; i < indecies.length; i++) {
								$scope.matchList[indecies[i]].style['background-color'] = '#00ff00';
							}
						} else {
							for (var i = 0; i < $scope.matchList.length; i++) {
								$scope.matchList[i].style['background-color'] = 'yellow';
							}
						}
					})
					var xButton = document.createElement('button');
					xButton.id = 'xButton';
					xButton.innerHTML = 'X'
					newButton.appendChild(xButton);
					xButton.addEventListener('click', function(event) {
						newButton.parentNode.removeChild(newButton);
						var index = $rootScope.apiRoute.data.indexOf(newButton.dataProp)
						$rootScope.apiRoute.data.splice(index, 1);
						event.preventDefault();
						event.stopPropagation();
					})
					newButton.onmouseover = function() {
						xButton.style.opacity = 1;
					}
					newButton.onmouseout = function() {
						xButton.style.opacity = 0;
					}
					document.getElementById('propButtons').appendChild(newButton)

					//reset currentProperty
					$scope.currentProperty = {};
				}

				setUpDom($scope);

			})
			.controller('previewDataCtrl',function($scope,$rootScope){
				$scope.showCollectionSelected = true;
				$scope.dataPreview = {};
				$scope.rows;
				$scope.getRowCount = function() {
			        var n = 0
			        for (var key in $scope.dataPreview) {
			          var l = $scope.dataPreview[key].length
			          if (l > n) n = l
			        }
			        return new Array(n + 1).join('0').split('').map(function(d, i) { return { index: i } })
			     }

				$scope.showCollection = function(){
					$scope.showCollectionSelected = true;
				}

				$scope.showPreviewData = function(){	
					$scope.showCollectionSelected = false;
					$rootScope.apiRoute.data.forEach(function(d){
						$scope.dataPreview[d.name] = document.querySelectorAll(d.selector).map(function(elem){
							if(d.attr) return elem[d.attr];
							return elem.textContent;
						})
					})
					$scope.headers = Object.keys($scope.dataPreview)
					$scope.rows = $scope.getRowCount();
					console.log($scope.dataPreview);
				}



			})
			.controller("OverlayCtrl", function($scope, $http, AuthService, $rootScope, AUTH_EVENTS, Route, Session) {
				$scope.showLogin = true;
				$scope.error = null;
				$scope.user;
				if (Session.user) $scope.user = Session.user;
				$scope.Depths = [{
					Id: "1",
					text: "10 pages max",
					value: 10
				}, {
					Id: "2",
					text: "15 pages max",
					value: 15
				}, {
					Id: "3",
					text: "25 pages max",
					value: 25
				}];

				$rootScope.apiRoute.pagination = [];
				if (!$rootScope.apiRoute.pagination.length) {
					$rootScope.apiRoute.pagination.limit = $scope.Depths[0].value;
				}
				$scope.toggleLogin = function() {
					if ($scope.showLogin) {
						$scope.showLogin = false;
						$scope.showSignup = true;
					} else {
						$scope.showLogin = true;
						$scope.showSignup = false;
					}
				}
				$scope.sendLogin = function(user) {
					AuthService.login(user)
						.then(function(user) {
							$scope.user = Session.user;
						}).
					catch(function() {
						$scope.error = "Invalid credentials";
					});
				};
				$scope.signUpNewUser = function(user) {
					AuthService.signup(user)
						.then(function() {
							$scope.user = Session.user;
						});
				}

				$scope.createNewRoute = function() {
					// console.log($rootScope.user)
					if (!$rootScope.apiRoute.data.length) {
						$scope.error = "You must create some routes first";
					} else {
						console.log(Session.user);
						$rootScope.apiRoute.user = Session.user._id;
						$rootScope.apiRoute.url = document.URL;
						$rootScope.apiRoute.data = $rootScope.apiRoute.data.map(function(d){
							d.selector = d.selector.split(/\s+/).slice(-3).join(' ');
							return d;
						})	
						new Route($rootScope.apiRoute).save().then(function(res) {
							console.log(res);
						})
					}
				}
			});

		/* Manually bootstrap the Angular app */
		window.name = '';
		// To allow `bootstrap()` to continue normally
		angular.bootstrap(appRoot, ['myApp']);
		// console.log(angular);
		console.log('Angularjs Boot and loaded !');
	})
}

function importJS(src) {
	var script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	script.setAttribute("src", src);
	document.getElementsByTagName("head")[0].appendChild(script);

	// $('head').appendChild(script);
}

function importCSS(href) {
	var css = document.createElement("link");
	css.setAttribute("rel", "stylesheet");
	css.setAttribute("type", "text/css");
	css.setAttribute("href", href);
	document.getElementsByTagName("head")[0].appendChild(css);
}

if (!document.getElementById('nodemonofy')) {
	startNodemono();
	// console.log(!$("#nodemonofy"));
} else {
	console.log('Nodemono\' already started');
}


function registerAuthService() {
	app.factory('Socket', function() {
		if (!window.io) throw new Error('socket.io not found!');
		return window.io(window.location.origin);
	});

	// AUTH_EVENTS is used throughout our app to
	// broadcast and listen from and to the $rootScope
	// for important events about authentication flow.
	app.constant('AUTH_EVENTS', {
		loginSuccess: 'auth-login-success',
		loginFailed: 'auth-login-failed',
		logoutSuccess: 'auth-logout-success',
		sessionTimeout: 'auth-session-timeout',
		notAuthenticated: 'auth-not-authenticated',
		notAuthorized: 'auth-not-authorized',
		serverUrl: '//localhost:' + (document.URL.indexOf('https') > -1 ? '3000' : '1337')
	});

	app.factory('AuthInterceptor', function($rootScope, $q, AUTH_EVENTS) {
		var statusDict = {
			401: AUTH_EVENTS.notAuthenticated,
			403: AUTH_EVENTS.notAuthorized,
			419: AUTH_EVENTS.sessionTimeout,
			440: AUTH_EVENTS.sessionTimeout
		};
		return {
			responseError: function(response) {
				$rootScope.$broadcast(statusDict[response.status], response);
				return $q.reject(response)
			}
		};
	});

	app.config(function($httpProvider) {
		$httpProvider.interceptors.push([
			'$injector',
			function($injector) {
				return $injector.get('AuthInterceptor');
			}
		]);
		$httpProvider.defaults.useXDomain = true;
		delete $httpProvider.defaults.headers.common['X-Requested-With'];
	});

	app.service('AuthService', function($http, Session, $rootScope, AUTH_EVENTS, $q) {

		function onSuccessfulLogin(response) {
			var data = response.data;
			Session.create(data.id, data.user || data);
			$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
			return data.user;
		}

		// Uses the session factory to see if an
		// authenticated user is currently registered.
		this.isAuthenticated = function() {
			return !!Session.user;
		};

		this.getLoggedInUser = function(fromServer) {

			// If an authenticated session exists, we
			// return the user attached to that session
			// with a promise. This ensures that we can
			// always interface with this method asynchronously.

			// Optionally, if true is given as the fromServer parameter,
			// then this cached value will not be used.

			if (this.isAuthenticated() && fromServer !== true) {
				return $q.when(Session.user);
			}

			// Make request GET /session.
			// If it returns a user, call onSuccessfulLogin with the response.
			// If it returns a 401 response, we catch it and instead resolve to null.
			return $http.get(AUTH_EVENTS.serverUrl + '/session').then(onSuccessfulLogin).
			catch(function() {
				return null;
			});

		};

		this.login = function(credentials) {
			return $http.post(AUTH_EVENTS.serverUrl + '/login', credentials)
				.then(onSuccessfulLogin)
				.
			catch(function() {
				return $q.reject({
					message: 'Invalid login credentials.'
				});
			});
		};

		this.logout = function() {
			return $http.get(AUTH_EVENTS.serverUrl + '/logout').then(function() {
				Session.destroy();
				$rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
			});
		};


		//added function for signup process
		//what's Q for?
		this.signup = function(credentials) {
			return $http.post(AUTH_EVENTS.serverUrl + '/signup', credentials)
				.then(onSuccessfulLogin)
				.
			catch(function() {
				return $q.reject({
					message: 'Invalid login credentials.'
				});
			})
		}
	});

	app.service('Session', function($rootScope, AUTH_EVENTS) {

		var self = this;

		$rootScope.$on(AUTH_EVENTS.notAuthenticated, function() {
			self.destroy();
		});

		$rootScope.$on(AUTH_EVENTS.sessionTimeout, function() {
			self.destroy();
		});

		this.id = null;
		this.user = null;

		this.create = function(sessionId, user) {
			this.id = sessionId;
			this.user = user;
		};

		this.destroy = function() {
			this.id = null;
			this.user = null;
		};

	});
}