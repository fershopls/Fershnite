if (typeof module != 'undefined') {
	var Property = require('./Property.js')
	var StackMaster = require('./StackMaster.js')
	var ModuleMaster = require('./ModuleMaster.js')
}

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
	},

	sync: function (module_id, value_id, id, value)
	{
		var module = this.get(module_id)
		data = {}
		data[id] = value
		module.setSync(value_id, data)
	}
})

if (typeof module != 'undefined')
	module.exports = StackModuleMaster