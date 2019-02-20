if (typeof module != 'undefined')
{
	var StackMaster = require('./StackMaster.js');
	var Property = require('./Property.js');
}

var ModuleMaster = {
	properties: {},
	values: [],

	init: function(propertiesList){
		this.values = Object.assign({}, StackMaster, {
			stack: [],
			getStack: function()
			{
				return this.stack
			}
		})

		StackMaster.loop(propertiesList, function(i, property){
			this.registerProperty(property)
		}, this)
		return this
	},

	registerProperty: function(property)
	{
		if (property.hasOwnProperty('id')
			&& property instanceof Property)
			this.properties[property.id] = property
	},

	getProperty: function(id)
	{
		if (!id)
			return this.properties
		if (this.properties.hasOwnProperty(id))
			return this.properties[id]
		return null
	},

	getKeysWithValues: function()
	{
		var keys = this.getProperty()
		var dic = {}

		StackMaster.loop(keys, function(id, property){
			dic[id] = this.get(id, property.default_value)
		}, this)
		
		return dic
	},

	hasProperty: function(id)
	{
		return this.properties.indexOf(id) != -1
	},

	get: function(id, default_value, dimension)
	{
		if (typeof id == 'undefined')
			return this.values.get()

		if (dimension)
			this.values.dimension(dimension)
		
		if (this.values.has(id))
			var value = def(this.values.get(id), default_value)

		if (dimension)
			this.values.dimension()
		
		return value
	},

	remove: function (value_id){
		return this.values.removeById(value_id)
	},

	setSingleProperty: function (value_id, key, value, sync)
	{
		var property = this.getProperty(key)
		if (this.get(value_id, key) == value)
			return false

		if (property)
		{

			this.values.dimension(value_id, function (){
				this.set(key, value)
			})

			if (property.allow_sync && sync)
				this.syncOutput({
					module_id: this.id,
					value_id: value_id,
					key: property.id,
					value: this.get(property.id, null, value_id)
				})
		}
	},

	set: function(value_id, dicKeyValue, sync)
	{
		sync = def(sync, true)
		StackMaster.loop(dicKeyValue, function(key, value){
			this.setSingleProperty(value_id, key, value, sync)
		}, this)

		return this.values.get(value_id)
	},

	setSync: function (value_id, data)
	{
		this.set (value_id, data)
	},

	syncModule: function()
	{
		this.get()
	},

	syncInput: function(data)
	{
		if (this.clientSide)
		{
			// console.log('CLIENT INPUT FROM SERVER', data)
			// console.log('GET', data.key, data.value)
			var keyValue = {}
			keyValue[data.key] = data.value
			this.set(data.value_id, keyValue, false)
			// console.log('PRNT', data.value_id, this.get(data.key, null, data.value_id))
		}
		else
		{
			// console.log('SERVER INPUT FROM CLIENT', data)
			this.syncOutput(data)
		}
	},

	syncOutput: function(data)
	{
		// data = {
		// 	module_id: data.module_id,
		// 	value_id: data.value_id,
		// 	key: data.key,
		// 	value: this.get(data.key, null, data.value_id),
		// }
		var socket = this.getSocketSide(data.value_id)
		if (this.clientSide)
		{
			this.clientOutput(socket, data)
		}
		else
		{
			this.serverOutput(socket, data)
		}
	},

	serverOutput: function (socket, data)
	{
		// console.log('SERVER OUTPUT', data)
		socket.emit('sync', data)
	},

	clientOutput: function(socket, data)
	{
		// console.log('CLIENT OUTPUT', data)
		socket.emit('sync', data)
	},

	getSocketSide: function (id)
	{
		var socket = this.getSocket(id)
		if (socket)
		{
			if (this.clientSide)
				return socket
			else
				return socket.broadcast
		}
		else
		{
			console.log('[!] Missing socket', id, 'client', this.clientSide)
		}
	},

	sync: function (module_id, value_id, id)
	{
		var value = this.get(value_id)
		if (value)
		{
			var socket = this.getSocket(module_id, value_id, id)
			if (socket)
			{
				if (this.clientSide)
					socket.emit('sync', module_id, value_id, id, value[id])
				else
					socket.broadcast.emit('sync', module_id, value_id, id, value[id])
			}
			else
			{
				console.log('[!] Missing socket')
			}
		}
		//console.log(module_id,value_id,'property',id,'change', this.get(value_id, id))
	},

	getSocket: function()
	{
		return 'Please override this function'
	},

}

if (typeof module != 'undefined')
	module.exports = ModuleMaster