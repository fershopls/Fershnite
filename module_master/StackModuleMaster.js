var Property = require('./Property.js')
var StackMaster = require('./StackMaster.js')
var ModuleMaster = require('./ModuleMaster.js')

var StackModuleMaster = Object.assign({}, StackMaster, {
	stack: [],
	getStack: function()
	{
		return this.stack
	},

	name: 'Stack Module Master',

	create: function(id, properties) {
		var module = this.initModule(id, properties)
		this.add(id, module)
		return module
	},

	initModule: function (id, properties)
	{
		var module = Object.assign({}, ModuleMaster, {id:id})
		return module.init(properties)
	}
})

if (typeof module != 'undefined')
	module.exports = StackModuleMaster