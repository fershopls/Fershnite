if (typeof module != 'undefined')
{
	var StackMaster = require('./StackMaster.js');
	var ModelMaster = require('./ModelMaster.js');
}

var ModuleMaster = {

	init: function(propertiesList){

		StackMaster.loop(propertiesList, function(i, property){
			this.registerProperty(property)
		}, this)
		return this
	},

	registerProperty: function(property)
	{
		if (property.hasOwnProperty('id'))
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
			dic[id] = this.get(id, property.default)
		}, this)
		
		return dic
	},

	hasProperty: function(id)
	{
		return this.properties().indexOf(id) != -1
	},

	retreiveAllData: function()
	{
		return this.getData().get()
	},

	retreiveKeyFromData: function(id, key)
	{
		var data = undefined
		this.getData().dimension(id, function(){
			data = this.get(key)
		})
		return data
	},

	retreive: function (id)
	{
		return this.getData().get(id)
	},
	
	get: function (id, key)
	{
		var value;

		if (typeof id == 'undefined')
			value = this.retreiveAllData()
		else if (typeof key != 'undefined')
			value = this.retreiveKeyFromData(id, key)
		else
			value = this.retreive(id)
		
		return value
	},

	remove: function (data_id, sync){
		sync = def(sync, true)

		var removeReturn = this.getData().removeById(data_id)
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
			var beforeSet = this.getData().get(key, data_id)
			this.getData().dimension(data_id, function (){
				this.set(key, value)
			})
			var afterSet = this.getData().get(key, data_id)

			var hasChanged = beforeSet != afterSet

			if (property.sync && sync)
			{
				var model = ModelMaster.new('updateSingleProperty', {
					module_id: this.id,
					data_id: data_id,
					key: property.id,
					value: this.get(data_id, property.id)
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

		return this.getData().get(data_id)
	},

	getSynchronizableProperties: function()
	{
		var syncProperties = []
		StackMaster.loop(this.properties(), function(id, property){
			if (property.sync)
				syncProperties.push(id)
		}, this)
		return syncProperties
	},

	create: function(data_id, initialKeyValue, sync)
	{
		sync = def(sync, true)
		
		StackMaster.loop(this.properties(), function(id, property){
			var value = def(initialKeyValue[id], property.default)
			this.setSingleProperty(data_id, id, value, sync)
		}, this)

		return this.getData().get(data_id)
	},

	syncInput: function(data, socket)
	{
		if (this.isClientSide)
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
			
			var propertyValidationPass = true
			// TODO DEL console.log('validation', property.id, property.onSetAttempt)
			if (typeof property.onSetAttempt == 'function')
			{
				var propertyValidationPass = property.onSetAttempt.call(this, socket, model)
			}

			if (property.broadcastable)
				var sync_socket = socket.broadcast
			else
				var sync_socket = undefined

			// TODO check if property.allow_client_edit == true
			if (propertyValidationPass)
			{
				this.syncOutput(model, sync_socket)
				// Update Properties
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
			console.log('[-]', data.module_id, model.data_id)
			this.remove(model.data_id, false)
		}
	},

	syncOutput: function(model, socket)
	{
		var socket = def(socket, this.getSocketSafe())
		
		if (this.isClientSide)
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
			if (!socket)
				console.log('missing socket')
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
			console.log('[!] Missing socket', (this.isClientSide)?'client':'server')
		}
	},

	requestGameUpdate: function()
	{
		// console.log('Please override requestGameUpdate function in server/client both sides')
	},

	getSocket: function()
	{
		console.log('Please override getSocket function in server/client both sides')
	},

}

if (typeof module != 'undefined')
	module.exports = ModuleMaster