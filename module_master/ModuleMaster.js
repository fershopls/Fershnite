if (typeof module != 'undefined')
{
	var StackMaster = require('./StackMaster.js');
	var ModelMaster = require('./ModelMaster.js');
	var Property = require('./Property.js');
}

var ModuleMaster = {
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
			this.properties()[property.id] = property
	},

	getProperty: function(id)
	{
		if (!id)
			return this.properties()
		if (this.properties().hasOwnProperty(id))
			return this.properties()[id]
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
		return this.properties().indexOf(id) != -1
	},

	getData: function()
	{
		return this.values
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

	remove: function (data_id, sync){
		sync = def(sync, true)

		var removeReturn = this.values.removeById(data_id)
		if (removeReturn && sync)
		{
			var model = ModelMaster.new('removeDataId', {
				module_id: this.id,
				data_id: data_id,
			})
			this.syncOutput(model)
		}
		return removeReturn
	},

	setSingleProperty: function (data_id, key, value, sync, socket)
	{
		var property = this.getProperty(key)
		if (this.get(data_id, key) == value)
			return false

		if (property)
		{

			this.values.dimension(data_id, function (){
				this.set(key, value)
			})

			if (property.allow_sync && sync)
			{
				var model = ModelMaster.new('updateSingleProperty', {
					module_id: this.id,
					data_id: data_id,
					key: property.id,
					value: this.get(property.id, null, data_id)
				})
				this.syncOutput(model, socket)
			}
		}
	},

	set: function(data_id, dicKeyValue, sync, socket)
	{
		sync = def(sync, true)
		StackMaster.loop(dicKeyValue, function(key, value){
			this.setSingleProperty(data_id, key, value, sync, socket)
		}, this)

		return this.values.get(data_id)
	},

	getSynchronizableProperties: function()
	{
		// StackMaster.loop(this.properties(), function(id, property){
		// 	console.log(id, property.allow_sync)
		// }, this)
	},

	create: function(data_id, initialKeyValue, sync)
	{
		sync = def(sync, true)
		
		StackMaster.loop(this.properties(), function(id, property){
			var value = def(initialKeyValue[id], property.default_value)
			this.setSingleProperty(data_id, id, value, sync)
		}, this)

		return this.values.get(data_id)
	},

	syncInput: function(data, socket)
	{
		if (this.clientSide)
		{
			this.syncInputClient(data, socket)
		}
		else
		{
			this.syncInputServer(data, socket)
		}
	},

	syncInputModelize: function (data)
	{
		return ModelMaster.new(data.model_id, data)
	},

	syncInputServer: function (data, socket)
	{
		var model = this.syncInputModelize(data)

		if (model.model_id == 'updateSingleProperty')
		{
			var property = this.getProperty(model.key)

			var propertyUpdateValidationPass = true
			if (typeof property.updateValidator == 'function')
			{
				var propertyUpdateValidationPass = property.updateValidator.call(this, socket, model)
			}

			if (property.broadcastable)
				var sync_socket = socket
			else
				var sync_socket = undefined

			// TODO check if property.allow_client_edit == true
			if (propertyUpdateValidationPass)
			{
				
				this.syncOutput(model, sync_socket)
				var dict = {}
				dict[model.key] = model.value
				this.set(model.data_id, dict, false)
			}
		}
	},

	syncInputClient: function (data, socket)
	{
		var model = this.syncInputModelize(data)

		if (model.model_id == 'updateSingleProperty')
		{
			// console.log('GET', model.key, model.value)
			var keyValue = {}
			keyValue[model.key] = model.value
			this.set(model.data_id, keyValue, false)
			// console.log('PRNT', model.data_id, this.get(model.key, null, model.data_id))
		}
		
		if (model.model_id == 'updateDataIdProperties')
		{
			this.set(model.data_id, model.data, false)
			console.log('[=] UPDATE DATA ', model.module_id, model.data_id)
		}

		if (model.model_id == 'removeDataId')
		{
			console.log('[-] PLAYER', model.data_id)
			this.remove(model.data_id, false)
		}
	},

	syncOutput: function(model, socket)
	{
		var socket = def(socket, this.getSocketSafe())
		
		if (this.clientSide)
		{
			this.clientOutput(model, socket)
		}
		else
		{
			this.serverOutput(model, socket)
		}
	},

	serverOutput: function (model, socket)
	{
		if (model.model_id == 'updateSingleProperty')
		{
			// console.log('TC > update', model.data_id, model.key)
			socket.emit('sync', model)
		}
		
		if (model.model_id == 'updateDataIdProperties')
		{
			// console.log('TC > update', model.data_id, model.key)
			socket.emit('sync', model)
		}
		
		if (model.model_id == 'removeDataId')
		{
			// console.log('TC > remove', model.data_id)
			socket.emit('sync', model)
		}
		
	},

	syncBulkDataToSocket: function (socket, data_callback)
	{
		this.getData().for(function(id, data){
			// TODO replace data_callback with Model Class .getSincronizableRules()
			if (typeof data_callback == 'function')
				var data = data_callback.call(this, data)

			var model = ModelMaster.new('updateDataIdProperties', {
				'module_id': this.id,
				'data_id': id,
				'data': data,
			})
			this.syncOutput(model, socket)
		}, this)
	},

	clientOutput: function(model, socket)
	{
		if (model.model_id == 'updateSingleProperty')
		{
			// console.log('TS > update', model.data_id, model.key)
			socket.emit('sync', model)
		}
	},

	getSocketSafe: function ()
	{
		var socket = this.getSocket()
		if (typeof this.getSocket == 'function' && socket)
		{
			return socket
		}
		else
		{
			console.log('[!] Missing socket', (this.clientSide)?'client':'server')
		}
	},

	requestGameUpdate: function()
	{
		return 'please override this function'
	},

	getSocket: function()
	{
		return 'Please override getSocket function in server/client both sides'
	},

}

if (typeof module != 'undefined')
	module.exports = ModuleMaster