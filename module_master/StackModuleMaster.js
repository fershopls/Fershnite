if (typeof module != 'undefined') {
	var Property = require('./Property.js')
	var StackMaster = require('./StackMaster.js')
	var ModuleMaster = require('./ModuleMaster.js')
}

var StackModuleMaster = Object.assign({}, StackMaster, {
	stack: [],
	
	isClientSide: null,
	getSocketCallback: null,

	start: function (isClientSide, getSocketCallback)
	{
		this.isClientSide = isClientSide
		this.getSocketCallback = getSocketCallback
	},

	getStack: function()
	{
		return this.stack
	},

	create: function(id, properties) {
		var module = this.initModule(id, properties)
		this.add(id, module)
		return module
	},

	initModule: function (id, properties)
	{
		var isClientSide = this.isClientSide
		var getSocketCallback = this.getSocketCallback

		var settings = {
			id:id,
			clientSide: isClientSide,
			getSocket: getSocketCallback,
			_properties: {},
			properties: function() {
				return this._properties
			}
		}
		var module = Object.assign({}, ModuleMaster, settings)
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