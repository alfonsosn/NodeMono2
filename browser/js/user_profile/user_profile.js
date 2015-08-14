app.config(($stateProvider) => {
  $stateProvider.state('user', {
    url: '/:id/profile',
    templateUrl: 'js/user_profile/user_profile.html',
    controller: ($scope, user, routes) => {
      $scope.user = user
      $scope.routes = routes

      console.log(user, routes)
    },
    resolve: {
      user: ($stateParams, User) => User.find($stateParams.id),
      routes: (user, Route) => Route.findAll({ '_user': user })
    }
  })
})