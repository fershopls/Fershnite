var StackMaster = {
	stack: [],
	current_dimension: null,
	name: 'none',

	dimension: function(id, callback)
	{
		if (typeof id == 'undefined')
		{
			this.current_dimension = null
		}
		else if (typeof callback == 'undefined')
		{
			this.current_dimension = id
		}
		else
		{
			this.dimension(id)
			callback.call(this, this.name)
			this.dimension()
		}
	},

	getDimension: function()
	{
		if (!this.current_dimension)
			return this.getStack()
		
		if (!this.getStack().hasOwnProperty(this.current_dimension))
			this.getStack()[this.current_dimension] = {}

		return this.getStack()[this.current_dimension]
	},

	get: function(id, dimension)
	{
		if (typeof id == 'undefined')
			return this.getDimension()
		
		if (typeof dimension == 'undefined')
		{
			if (this.getDimension().hasOwnProperty(id))
				return this.getDimension()[id]
		} else {
			this.dimension(dimension)
			var value = this.get(id)
			this.dimension()
			return value
		}
		return null
	},

	has: function(id)
	{
		return this.get().hasOwnProperty(id)
	},

	removeById: function (id)
	{
		if (this.has(id))
			delete this.get()[id]
	},

	removeByIndex: function (id)
	{
		if (this.has(id))
			this.get().splice(id, 1)
	},

	push: function(item)
	{
		this.get().push(item)
	},

	add: function(id, item)
	{
		this.get()[id] = item
	},

	set: function(id, value)
	{
		//console.log('STACK SET',id,value)
		this.get()[id] = value
	},

	addMany: function(items)
	{
		for (id in items)
		{
			var item = items[id]
			this.set(id, item)
		}
	},

	for: function(callback)
	{
		var items = this.get()
		this.loop(items, callback)
	},

	loop: function(items, callback, context)
	{
		context = context?context:callback
		for (id in items)
		{
			if (!items.hasOwnProperty(id))
				continue

			callback.call(context, id, items[id], items)
		}
	}
}

/*
player.stack.get()
player.stack.removeById()
*/
// Controladores
//	-> acceso y edición a modulo
// Stack
//	-> 
// Modulos
//	-> propiedades
//	-> propiedades sincronizables
//		-> detectar cambios
//		-> un sentido / ambos sentidos
//			-> allow_server_update / allow_client_update

def = (function(v, d) { return typeof v=='undefined'?d:v })
function Property (id, default_value, allow_sync, allow_sync_client_update)
{
	this.id = id
	this.default_value = def(default_value, null)
	this.allow_sync = def(allow_sync, true)
	this.allow_sync_client_update = def(allow_sync_client_update, false)
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

	get: function(value_id, id, default_value)
	{
		if (typeof value_id == 'undefined')
		{
			return this.values.get()
		}
		
		if (this.values.has(value_id))
		{
			if (typeof id == 'undefined')
			{
				return this.values.get(value_id)
			} else {
				return def(this.values.get(id, value_id), def(default_value, null))
			}
		}
		return null
	},

	setSingleProperty: function (value_id, key, value, without_sync)
	{
		var property = this.getProperty(key)
		if (property)
		{
			this.values.dimension(value_id, function (){
				this.set(key, value)
			})
			if (property.allow_sync && !without_sync)
				this.syncProperty(this.id, value_id, property.id)
		}
	},

	set: function(value_id, dicKeyValue, without_sync)
	{
		StackMaster.loop(dicKeyValue, function(key, value){
			this.setSingleProperty(value_id, key, value, without_sync)
		}, this)
	},

	syncProperty: function (module_id, value_id, id)
	{
		//console.log(module_id,value_id,'property',id,'change', this.get(value_id, id))

	},
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
	}
})

if (typeof module != 'undefined')
	module.exports = {
		StackMaster: StackMaster,
		ModuleMaster: ModuleMaster,
		Property: Property,
		def: def,
		StackModuleMaster: StackModuleMaster, 
	}

// StackModuleMaster.create('players_module', [
// 		new Property('X', 0),
// 		new Property('Y', 0),
// 		new Property('Z', 0),
// 	])
// var players = StackModuleMaster.get('players_module')

// players.set('X0001', {
// 	X: 998,
// 	Y: 666,
// }, false)

// console.log('MODULES:', Object.keys(StackModuleMaster.get()))
// console.log('VALUES:', players.values.get('X0001'))