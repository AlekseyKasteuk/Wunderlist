var app = angular.module('WunderlistServecies', ['ngStorage']);

app.factory('AppRoute', ['$http', '$localStorage', function($http, $localStorage){
	return {
		login: function (data) {
			return $http.post('/login', data);
		},
		register: function (data) {
			return $http.post('/register', data);
		},
		checkAuth: function () {
			var data = $localStorage.user;
			return $http.post('/login', data);
		},
		addList: function (name) {
			console.log("Add List");
			var data = $localStorage.user;
			data.name = name;
			return $http.post('/list', data);
		},
		getLists: function () {
			console.log("Get Lists");
			return $http.get('/lists?username=' + $localStorage.user.username + '&password=' + $localStorage.user.password);
		},
		addTask: function (d) {
			console.log("Add task");
			var data = $localStorage.user;
			data.name = d.name;
			data.list = d.list;
			console.log(data);
			return $http.post('/task', data);
		},
		getList: function (id) {
			console.log(id);
			return $http.get('/list' + id +'?username=' + $localStorage.user.username + '&password=' + $localStorage.user.password);
		},
		getTask: function (id) {
			return $http.get('/task' + id +'?username=' + $localStorage.user.username + '&password=' + $localStorage.user.password);
		},
		updateList: function (data) {
			console.log("Update list");
			var d = data;
			d.sender = $localStorage.user;
			return $http.put('/list' + data.id, d);
		},
		invite: function (user, list) {
			console.log("Invite");
			return $http.post('/invite', {user: user, list: list, sender: $localStorage});
		},
		acceptInvite: function (list) {
			console.log("Accept invite");
			return $http.put('/invite' + list.id, $localStorage.user);
		},
		deleteList: function (list) {
			console.log("Delete list");
			return $http.delete('/list' + list.id + "?username=" + $localStorage.user.username + "&password=" + $localStorage.user.password);
		},
		deleteTask: function (task) {
			console.log("Delete task");
			return $http.delete('/Task' + task.id + "?username=" + $localStorage.user.username + "&password=" + $localStorage.user.password);
		},
		changeTask: function (id, v) {
			console.log("Change task");
			var data = {sender: $localStorage.user, v: v};
			return $http.put('/task' + id, data);
		},
		deleteFile: function (id) {
			$http.delete('/file' + id);
		},
		getUser: function () {
			return $http.get("/user?username=" + $localStorage.user.username + "&password=" + $localStorage.user.password)
		},
		addSubtask: function (data) {
			return $http.post('/subtask', data);
		},
		deleteSubtask: function (id) {
			return $http.delete('/subtask' + id);
		},
		changeSubtask: function (data) {
			return $http.put('/subtask' + data._id, data);
		},
		editUser: function (data, id) {
			console.log(data, id);
			return $http.put('/user' + id, data)
		}
	}
}])