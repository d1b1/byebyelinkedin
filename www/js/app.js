angular.module('ionic-firebase-seed', ['ionic', 'firebase', 'angularMoment'])

.constant('FBURL', 'https://byebylinkedin.firebaseio.com/')

.config(function() {
  var config = {
    apiKey: "AIzaSyAAuj5EjmdlCEGJyl2v3dWM4hHaWPaXggg",
    authDomain: "byebylinkedin.firebaseapp.com",
    databaseURL: "https://byebylinkedin.firebaseio.com",
    storageBucket: "byebylinkedin.appspot.com",
    messagingSenderId: "296680620726"
  };
  firebase.initializeApp(config);
})

.factory('Auth', function($firebaseAuth, FBURL, $window) {
  return $firebaseAuth();
})

.factory('Following', function($http, $q) {
    var cache = [];
    var req = {
        method: 'GET',
        url: 'https://api.github.com/user/following',
         headers: {
           'Authorization': 'token ' + localStorage.getItem('github.accessToken')
         }
    };

    return {
        fetch: function() {
            return $http(req).then(function(data) {
                var items = data.data;
                _.each(items, function(user) {
                    var get = {
                        method: 'GET',
                        url: 'https://api.github.com/users/' + user.login,
                         headers: {
                           'Authorization': 'token ' + localStorage.getItem('github.accessToken')
                         }
                    };

                    $http(get).then(function(res) {
                        user.additional = res.data;
                    });
                });

                return items;
            });
        },
        force: function() {
            return $http(req).then(function(data) {
                return data.data;
            });
        },
        unfollow: function(user) {
            return $http(req).then(function(idx, data) {
                // Remove it from the cache.
                cache.splice(idx, 1);

                return data;
            }, function(err) {
                console.log('error', err);
            });
        }
    };

})

.factory('Followers', function($http, $q) {

    var deferred = $q.defer();
    var cache = [];
    var req = {
        method: 'GET',
        url: 'https://api.github.com/user/followers',
         headers: {
           'Authorization': 'token ' + localStorage.getItem('github.accessToken')
         }
    };

    return {
        fetch: function() {
            return $http(req).then(function(data) {
                var items = data.data;
                _.each(items, function(user) {
                    var get = {
                        method: 'GET',
                        url: 'https://api.github.com/users/' + user.login,
                         headers: {
                           'Authorization': 'token ' + localStorage.getItem('github.accessToken')
                         }
                    };

                    $http(get).then(function(res) {
                        user.additional = res.data;
                    });
                });

                return items;
            });
        },
        force: function() {
            return $http(req).then(function(data) {
                return data.data;
            });
        },
        unfollow: function(user) {
            return $http(req).then(function(idx, data) {
                // Remove it from the cache.
                cache.splice(idx, 1);

                return data;
            }, function(err) {
                console.log('error', err);
            });
        }
    };
})

.factory('Users', function($http, $q) {

    var cache = [];
    var term = localStorage.getItem('github.searchterm') || '';

    function getUrl() {
        return {
            method: 'GET',
            url: 'https://api.github.com/search/users?q=' + term,
            headers: {
               'Authorization': 'token ' + localStorage.getItem('github.accessToken')
            }
        };
    }

    return {
        account: function(uid) {
            var deferred = $q.defer();
            var ref = firebase.database().ref().child('users').child(uid);

            ref.on('child_added', function(snap) {
                if (snap.key === 'token') deferred.resolve(snap.val());
            });

            return deferred.promise;
        },
        results: function() {
            var deferred = $q.defer();

            if (localStorage.getItem('github.search')) {
                var data = JSON.parse(localStorage.getItem('github.search'));
                cache = data;
                deferred.resolve(data);
            } else {
                deferred.resolve([]);
            }

            return deferred.promise;
        },
        fetch: function() {
            return $http(getUrl()).then(function(data) {
                cache = data.data;
                console.log('Fetching from Gitub (Search)', cache);
                localStorage.setItem('github.search', JSON.stringify(cache));
                return cache;
            });
        },
        search: function(str) {
            term = str;
            localStorage.setItem('github.searchterm', term);
            var req = getUrl();

            return $http(getUrl()).then(function(data) {
                cache = data.data.items;
                localStorage.setItem('github.search', JSON.stringify(cache));
                return cache;
            });
        },
        get: function(user) {
            var req = {
                method: 'GET',
                url: 'https://api.github.com/users/' + user.login,
                headers: {
                   'Authorization': 'token ' + localStorage.getItem('github.accessToken')
                }
            };

            return $http(req).then(function(data) {
                return data.data;
            }, function(err) {
                console.log('error', err);
            });
        },
        patch: function(data) {
            var req = {
                method: 'PATCH',
                url: 'https://api.github.com/user',
                headers: {
                   'Authorization': 'token ' + localStorage.getItem('github.accessToken')
               },
               data: data
            };


            return $http(req).then(function(data) {
                return data.data;
            }, function(err) {
                console.log('error', err);
            });
        },
        self: function(user) {
            var req = {
                method: 'GET',
                url: 'https://api.github.com/user',
                headers: {
                   'Authorization': 'token ' + localStorage.getItem('github.accessToken')
                }
            };

            return $http(req).then(function(data) {
                return data.data;
            }, function(err) {
                console.log('error', err);
            });
        },
        follow: function(user) {
            var req = {
                method: 'PUT',
                url: 'https://api.github.com/user/following/' + user.login,
                headers: {
                   'Authorization': 'token ' + localStorage.getItem('github.accessToken')
                }
            };

            return $http(req).then(function(data) {
                // Remove it from the cache.
                cache.push(data);

                // Store it again.
                localStorage.setItem('github.search', JSON.stringify(cache));

                // Return it.
                return data;
            }, function(err) {
                console.log('error', err);
            });
        }
    };
})

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })
  .state('tab.following', {
    url: '/following',
    resolve: {
          'currentUser': ['Auth', function(Auth) {
              return Auth.$requireSignIn();
          }],
    },
    views: {
      'following': {
        templateUrl: 'templates/tab-following.html',
        controller: function($scope, Following) {

            $scope.doRefresh = function() {
                Following.force().then(function(data) {
                    $scope.$broadcast('scroll.refreshComplete');
                });
            };

            // Fetch all the current user they are following.
            Following.fetch().then(function(data) {
                $scope.following = data;
            });

            // Allow the user to unfollow.
            $scope.unfollow = function(idx, user) {
                Following.unfollow(idx, user).then(function() {
                    $scope.following.splice(idx, 1);
                });
            };
        }
      }
    }
  })
  .state('tab.followers', {
      url: '/followers',
      resolve: {
            'currentUser': ['Auth', function(Auth) {
                return Auth.$requireSignIn();
            }],
      },
      views: {
        'followers': {
          templateUrl: 'templates/tab-followers.html',
          controller: function($scope, Followers) {

              $scope.doRefresh = function() {
                  Followers.force().then(function(data) {
                      $scope.$broadcast('scroll.refreshComplete');
                  });
              };

              Followers.fetch().then(function(data) {
                  $scope.followers = data;
              });
          }
        }
      }
  })
  .state('tab.search', {
      url: '/search',
      resolve: {
            'currentUser': ['Auth', function(Auth) {
                return Auth.$requireSignIn();
            }],
      },
      views: {
        'search': {
          templateUrl: 'templates/tab-search.html',
          controller: function($scope, Users, $ionicModal) {
              // Get Set the User term.

              $scope.results = [];
              Users.results().then(function(data) {
                  $scope.results = data;
              });

              $scope.search = {
                  term: localStorage.getItem('github.searchterm') || ''
              };

              // Setup the function to erun on foreced refresh.
              $scope.doRefresh = function() {
                    Users.search($scope.search.term).then(function(data) {
                        $scope.$broadcast('scroll.refreshComplete');
                        $scope.results = data;
                    });
              };

              $scope.searchNow = function() {
                  Users.search($scope.search.term).then(function(data) {
                      $scope.$broadcast('scroll.refreshComplete');
                      $scope.results = data;
                  });
              };

              // Watch for changes in the search terms.
              $scope.$watch('search.term', _.debounce(function(newVal, oldVal) {
                  if (newVal !== oldVal) {
                      Users.search(newVal).then(function(data) {
                          $scope.results = data;
                      });
                  }
              }, 500), false);

              // Allow the user to unfollow.
              $scope.openFollow = function(user) {
                $scope.spinnerLogin = user.login;

                Users.get(user).then(function(data) {
                    $scope.user = user;
                    $scope.userInfo = data;

                    $ionicModal.fromTemplateUrl('/templates/follow.html', {
                      scope: $scope,
                      animation: 'slide-in-up'
                    }).then(function(modal) {
                      $scope.modal = modal;
                      $scope.modal.show();

                      $scope.follow = function() {
                            if (confirm('Do you want to following this user?')) {
                                Users.follow(user).then(function() {
                                    // All Done.
                                    user.added = true;
                                });
                            }
                      };

                      $scope.closeModal = function() {
                          $scope.modal.hide();
                          $scope.spinnerLogin = null;
                      };
                    });
                });
              };
          }
        }
      }
  })
  .state('tab.account', {
    url: '/account',
    resolve: {
          'currentUser': ['Auth', function(Auth) {
              return Auth.$requireSignIn();
          }],
    },
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: function($scope, Auth, currentUser, Users) {

            $scope.user = currentUser;

            Users.self().then(function(data) {
                $scope.user = data;
            });

            $scope.logout = function() {
              Auth.$signOut();
            };
        }
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab');
})

.controller('AppCtrl', function($scope, Auth, $rootScope, Users, $ionicModal, $state) {

  Auth.$onAuthStateChanged(function(user) {
      if (user) {
        $scope.loggedInUser = user;
        $rootScope.loggedInUser = user;

        Users.account(user.uid).then(function(token){
            $rootScope.accessToken = token;
            localStorage.setItem('github.accessToken', token);
        });

      } else {
        $scope.loggedInUser = null;

        $ionicModal.fromTemplateUrl('/templates/login.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.modal = modal;
          $scope.modal.show();

          $scope.login = function() {
              var provider = new firebase.auth.GithubAuthProvider();
              provider.addScope('user,user:follow');

              var githubToken = null;
              Auth.$signInWithPopup(provider).then(function(result) {
                  // This gives you a GitHub Access Token. You can use it to access the GitHub API.
                  var token = result.credential.accessToken;
                  $rootScope.githubToken = token;

                  localStorage.setItem('github.accessToken', token);
                  var user = result.user;
                  return user;
              })
              .then(function(user) {
                  var ref = firebase.database().ref().child('users');
                  ref.child(user.uid).update({ token: $rootScope.githubToken, email: user.email, uid: user.uid, displayName: user.displayName, lastLogin: moment().format() });
                  return;
              })
              .then(function() {
                  $scope.modal.hide();
                  $state.go('tab.following');
              })
              .catch(function(error) {
                  // Handle Errors here.
                  var errorCode = error.code;
                  var errorMessage = error.message;
                  var email = error.email;
                  var credential = error.credential;
                });
          };

          $scope.closeModal = function() {
              $scope.modal.hide();
              $scope.spinnerLogin = null;
          };
        });
      }
  });

  // Log a user out
  $scope.logout = Auth.$signOut;
})

.run(function($ionicPlatform, FBURL) {
  $ionicPlatform.ready(function() {

    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }

    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

  });
});
