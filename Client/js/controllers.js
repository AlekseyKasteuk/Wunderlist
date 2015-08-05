var app = angular.module('WunderlistControllers', [
	'WunderlistServecies', 
	'ngStorage'
	]);

app.factory('socket', ['$rootScope', '$localStorage', function ($rootScope, $localStorage) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
}]);

app.controller('AuthCtrl', ['$scope', '$http', 'AppRoute', '$localStorage', '$location', function($scope, $http, AppRoute, $localStorage, $location){
	$scope.user = {
		username: "",
		password: ""
	}
	$scope.newUser = {
		name: "",
		email: "",
		password: ""
	}

	$scope.submitForm = function () {
		if(!/^(\w|_|\.)+@\w+\.[a-z]+$/g.test($scope.user.username)) {
			$scope.logEmailValid = true;
			return;
		}
		if(!/^(\w|_){3,64}$/g.test($scope.user.password)) {
			$scope.logPasswordValid = true;
			return;
		}
		AppRoute.login($scope.user).success(function (response) {
			if ($localStorage.user) {
				$localStorage.$reset();
			}
			$localStorage.user = $scope.user;
			console.log(arguments);
			$location.path('/');
		}).error(function () {
			alert("Some mistaces in email or password!");
			$scope.correctUser = "error";
		});
	}
	$scope.registration = function () {
		if(!$scope.newUser.name) {
			$scope.nameValid = true;
			return;
		}
		if(!/^(\w|_|\.)+@(\w|\.)+\.[a-z]+$/g.test($scope.newUser.email)) {
			$scope.emailValid = true;
			return;
		}
		if(!/^(\w|_){3,64}$/g.test($scope.newUser.password)) {
			$scope.passwordValid = true;
			return;
		}
		AppRoute.register($scope.newUser).success(function (response) {
			$scope.newUser.name = "";
			$scope.newUser.email = "";
			$scope.newUser.password = "";
			$('#cancel').click();
		}).error(function () {
			$scope.registrationError = true;
		});
	}
}]);

app.controller('AppCtrl', ['$scope', '$localStorage', '$location', 'AppRoute', 'socket', '$rootScope', function($scope, $localStorage, $location, AppRoute, socket, $rootScope){
	$scope.newList = "";
	
	$scope.changeListName = false;
	
	$scope.newUser = "";
	$scope.selectedList = null;

	$scope.selectList = function (list) {
		$scope.selectedList = list;
	}

	$scope.add = function (operation, event) {
		if(operation == 'List'){ 
			AppRoute.addList($scope.newList);
			$scope.newList = "";
		}
		if(operation == 'User') {
			console.log("User:", $scope.newUser, "List:", $scope.selectedList);
			AppRoute.invite($scope.newUser, $scope.selectedList.id).success(function (res) {
				$scope.newUser = "";
			})
		}
	}
	$scope.updateList = function () {
		AppRoute.updateList($scope.selectedList).error(function (res) {
		});
	}
	$scope.deleteList = function (list) {
		AppRoute.deleteList(!!list ? list : $scope.selectedList);
	}
	$scope.logout = function () {
		$localStorage.$reset();
		$location.path('/auth');
	}
	$scope.newUser = {};
	$scope.getUser = function () {
		AppRoute.getUser().success(function (response) {
			$rootScope.user = response;
			$scope.newUser.name = response.name;
		}).error(function () {
			$scope.logout();
		});
	}
	$scope.getUser();
	$scope.editUserProfile = function () {
		if(!$scope.newUser.name) {
			$scope.nameValid = true;
			return;
		}
		if(!/^(\w|_){3,64}$/g.test($scope.newUser.password)) {
			$scope.passwordValid = true;
			return;
		}
		if(!/^(\w|_){3,64}$/g.test($scope.newUser.repeatPassword)) {
			$scope.repeatPasswordValid = true;
			return;
		}
		AppRoute.editUser($scope.newUser, $rootScope.user._id).success(function (response) {
			$('#cancel').click();
			$scope.newUser.password = "";
			$scope.newUser.repeatPassword = "";
			$scope.getUser();
		});
	}
}]);

app.controller('ListsCtrl', ['$scope', 'socket', 'AppRoute', '$localStorage', '$location', '$rootScope', function($scope, socket, AppRoute, $localStorage, $location, $rootScope){
	AppRoute.getLists().success(function (res) {
		$scope.lists = res;
		console.log(res);
	});
	socket.on('newlist', function (data) {
		if(data.owner.email == $localStorage.user.username) {
			$scope.lists.own.push(data);
		}
	})
	socket.on('movetoshared', function (data) {
		if(data.user == $localStorage.user.username) {
			$scope.lists.shared.push(data.msg);
			var k = 0;
			$scope.lists.invites.forEach(function (v) {
				if (v.id == data.msg.id) {
					$scope.lists.invites.splice(k, 1);
					return;
				};
				k++;
			});
		}
	})
	socket.on('deleteList', function (data) {
		if(data.user == '*' || data.user == $localStorage.user.username) {
			for (key in $scope.lists) {
				var k = 0;
				$scope.lists[key].forEach(function (v) {
					if (v.id == data.list) {
						$scope.lists[key].splice(k, 1);s
						return;
					};
					k++;
				});
			}
		}
	})
	socket.on('invite', function (data) {
		if(data.user == $localStorage.user.username) {
			$scope.lists.invites.push(data.msg);
		}
	})
	socket.on('update_list_name', function (data) {
		for (key in $scope.lists) {
			$scope.lists[key].forEach(function (v) {
				if (v.id == data.id) {
					v.name = data.name;
				};
			});
		}
	})
	$scope.acceptInvite = function (list) {
		AppRoute.acceptInvite(list)
	}
}])

app.controller('TaskCtrl', ['$scope', 'AppRoute', 'socket', '$stateParams', '$location', function($scope, AppRoute, socket, $stateParams, $location){
	$scope.tasks = [];
	$scope.newTask = "";

	AppRoute.getList($stateParams.list).success(function (res) {
		$scope.list = res.list;
		$scope.tasks = res.data;
	}).error(function () {
		$location.path('/lists');
	})

	$scope.add = function (event) {
		if(!!$scope.newTask && event.keyCode == 13) {
			AppRoute.addTask({name: $scope.newTask, list: $scope.list.id}).success(function (res) {
				$scope.newTask = "";
			})
		}
	}

	socket.on('update_list_name', function (data) {
		if(data.id == $scope.list.id) {
			$scope.list = data;
		}
	})

	socket.on('deleteList', function (data) {
		console.log(data.id, $stateParams.list);
		if(data.list == $stateParams.list) {
			$location.path('/lists')
		}
	})

	$scope.updateTask = function (value, id) {
		console.log(id, value);
		AppRoute.changeTask(id, value);
	}

	socket.on('deleteTask', function (data) {
		var k = 0;
		$scope.tasks.forEach(function (v) {
			if(v.id == data.id) {
				$scope.tasks.splice(k, 1);
				return;
			}
			k++;
		});
	})
	socket.on('addtask', function (data) {
		if($scope.list.id == data.list) {
			data.date = new Date(data.date);
			$scope.tasks.push(data);
		}
	})
	socket.on('update_task', function (res) {
		console.log(res);
		$scope.tasks.forEach(function (v) {
			if(v.id == res.id) {
				v.name = res.name;
				v.done = res.done;
				return;
			}
		})
	})
}])

app.controller('InfoCtrl', ['$scope', 'AppRoute', 'Upload', 'socket', '$rootScope', '$stateParams', '$location', function($scope, AppRoute, Upload, socket, $rootScope, $stateParams, $location){
	$scope.changes = {
		name: false,
		description: false
	}
	socket.on('deleteTask', function (data) {
		if($scope.task.id == data.id) {
			$location.path('/lists/' + $stateParams.list);
		}
	})
	$scope.myfiles = [];
	$scope.newSubtask = "";
	$scope.initialHeight = "20px";
	AppRoute.getTask($stateParams.subtask).success(function (res) {
		res.date = new Date(res.date);
		$scope.task = res;
	}).error(function () {
		$location.path('/lists/' + $stateParams.list);
	})
	$scope.changeTask = function (change, element, value) {
		console.log(value);
		if(change) {
			AppRoute.changeTask(value.id, value);
			$scope.changes[element] = false;
		}
	}
	$scope.$watch('files', function () {
        $scope.upload($scope.files);
    });
    $scope.upload = function (files) {
        if (files && files.length) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                Upload.upload({
	            url: '/file',
	            fields: {'task': $scope.task.id},
	            file: file
	        })
            }
        }
    };
    socket.on('getFiles', function (data) {
		if($scope.task.id != data.info.task) { return; }
		if($scope.myfiles.map(function (file) {
					return file.id;
				}).indexOf(data.info.id) == -1) {
			var arrayBufferView = new Uint8Array( data.data[0] );
		    var blob = new Blob( [ arrayBufferView ], { type: data.info.type } );
		    var urlCreator = window.URL || window.webkitURL;
		    var imageUrl = urlCreator.createObjectURL( blob );
		    if(data.info.type.split('/')[0] != 'image') { return; }
		    $scope.myfiles.push({id: data.info.id, src: imageUrl});
		}
    })
    socket.on('deleteFile', function (id) {
    	var index = $scope.myfiles.map(function (v) {
    		return v.id;
    	}).indexOf(id);
    	if(index != -1) {
    		$scope.myfiles.splice(index, 1);
    	}
    });
    $scope.selectIMG = function (src) {
    	$rootScope.selectedIMG = src;
    }
    $scope.deleteFile = function (file) {
    	AppRoute.deleteFile(file.id);
    }
    socket.on('update_task', function (res) {
		if($scope.task.id == res.id){
			$scope.task.name = res.name;
			$scope.task.done = res.done;
			$scope.task.date = new Date(res.date);
			$scope.task.description = res.description;
		}
	})
	$scope.deleteTask = function () {
		AppRoute.deleteTask($scope.task)
	}
	$scope.addSubtask = function () {
		AppRoute.addSubtask({task: $scope.task.id, name: $scope.newSubtask}).success(function () {
			$scope.newSubtask = "";
		})
	}
	$scope.deleteSubtask = function (id) {
		AppRoute.deleteSubtask(id);
	}
	$scope.changeSubtask = function (subtask, code) {
		if(!code) {
			return;
		}
		AppRoute.changeSubtask(subtask);
	}
	socket.on('addSubtask', function (data) {
		if(!$scope.task) { return }
		if(data.task == $scope.task.id) {
			$scope.task.subtasks.push(data.subtask);
		}
	})
	socket.on('changeSubtask', function (data) {
		$scope.task.subtasks.forEach(function (st) {
			if(st._id == data._id) {
				st.name = data.name;
				st.done = data.done;
				return;
			}
		})
	})
	socket.on('deleteSubtask', function (id) {
		var k = 0;
		$scope.task.subtasks.forEach(function (st) {
			if(st._id == id) {
				$scope.task.subtasks.splice(k, 1);
				return;
			}
			k++;
		})
	})
}])