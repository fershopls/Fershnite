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

	sendModulesTo: function (socket, stack)
	{
		var modules = {};
		this.for(function(key, value){
			modules[key] = value.getSynchronizableProperties()
		}, this)

		socket.emit('modules', modules)
	},

	loadModules: function (modules)
	{
		StackMaster.loop(modules, function (module_id, properties) {
			var instancedProperties = []
			StackMaster.loop(properties, function(index, property_id) {
				instancedProperties.push(this.field(property_id, {
					sync: true,
				}))
			}, this)
			this.create(module_id, instancedProperties)
		}, this)
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

	getDefaultFieldSettings: function()
	{
		return {
			default: null,
			sync: false,
			broadcastable: false,
			onSetAttempt: null,
		}
	},

	field: function(id, settings)
	{
		var defaultSettings = this.getDefaultFieldSettings()
		var field = Object.assign({}, defaultSettings, settings, {id: id})
		return field
	},

	initModule: function (id, properties)
	{
		var isClientSide = this.isClientSide
		var getSocketCallback = this.getSocketCallback

		var settings = {
			id:id,
			isClientSide: isClientSide,
			getSocket: getSocketCallback,
			_properties: {},
			properties: function() {
				return this._properties
			},
			_data: Object.assign({}, StackMaster, {
				stack: [],
				getStack: function()
				{
					return this.stack
				}
			}),
			getData: function() {
				return this._data
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