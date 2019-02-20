var StackMaster = require('./StackMaster.js');
var Property = require('./Property.js');

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

	getValues: function()
	{
		return this.values
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
				// TODO persistent id Object.assign({values}, {id: real_id})
				return this.values.get(value_id)
			} else {
				return def(this.values.get(id, value_id), def(default_value, null))
			}
		}
		return null
	},

	remove: function (value_id){
		return this.values.removeById(value_id)
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
				this.sync(this.id, value_id, property.id)
		}
	},

	set: function(value_id, dicKeyValue, without_sync)
	{
		StackMaster.loop(dicKeyValue, function(key, value){
			this.setSingleProperty(value_id, key, value, without_sync)
		}, this)

		return this.values.get(value_id)
	},

	sync: function (module_id, value_id, id)
	{
		//console.log(module_id,value_id,'property',id,'change', this.get(value_id, id))
	},
}

if (typeof module != 'undefined')
	module.exports = ModuleMaster