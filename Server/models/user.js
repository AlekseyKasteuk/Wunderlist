var mongoose = require('mongoose');

var User = mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		unique: true,
		required: true
	},
	password: {
		type: String,
		required: true
	}
});

var userModel = mongoose.model("User", User);
userModel.schema.path('name').validate(function (value) {
	return !!value;
}, "Invalid name");
userModel.schema.path('email').validate(function (value) {
	return /^(\w|_|\.)+@\w+\.[a-z]+$/g.test(value);
}, "Invalid email");
userModel.schema.path('password').validate(function (value) {
	return /^(\w|[а-яА-Я_]){3,64}$/g.test(value);
}, "Invalid password");

module.exports = userModel;