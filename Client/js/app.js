var app = angular.module('Wunderlist', [
	'WunderlistServecies', 
	'ngStorage', 
	'WunderlistControllers',
	'ui.router',
	'ngFileUpload'
	]);

app.directive('elastic', [
    '$timeout',
    function($timeout) {
        return {
            restrict: 'A',
            link: function($scope, element) {
                $scope.initialHeight = $scope.initialHeight || element[0].style.height;
                var resize = function() {
                    element[0].style.height = $scope.initialHeight;
                    element[0].style.height = "" + element[0].scrollHeight + "px";
                };
                element.on("blur keyup change", resize);
                $timeout(resize, 0);
            }
        };
    }
]);

app.config(['$httpProvider', '$urlRouterProvider', '$stateProvider', '$locationProvider', function($httpProvider, $urlRouterProvider, $stateProvider, $locationProvider) {
        // $locationProvider.html5Mode({
        // 	enabled: true,
        // 	requireBase: false
        // });
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];

        $urlRouterProvider.otherwise('/lists');

        $stateProvider
        	.state('auth', {
        		url: '/auth',
        		templateUrl: 'templates/auth.html',
        		controller: 'AuthCtrl'
        	})
        	.state('lists', {
        		url: '/lists',
        		templateUrl: 'templates/lists.html',
        		controller: 'AppCtrl'
        	})
            .state('lists.tasks', {
                url: '/:list',
                templateUrl: 'templates/tasks.html',
                controller: 'TaskCtrl'
            })
            .state('lists.tasks.info', {
                url: '/:subtask',
                templateUrl: 'templates/info.html',
                controller: 'InfoCtrl'
            })
    }
])

app.run(['$rootScope', '$state', '$stateParams', 'AppRoute', '$location', function ($rootScope, $state, $stateParams, AppRoute, $location) {
	$rootScope.$on('$stateChangeStart', function () {
		AppRoute.checkAuth().success(function (res) {
			if($location.path() == '/auth') {
				$location.path('/');
			}
		}).error(function () {
			if($location.path() != '/auth') {
				$location.path('/auth');
			}
		})
	});
}])