if (typeof module != 'undefined')
{
	var StackMaster = require('./StackMaster.js');
}

var ModelMaster = {

	getIdRules: function()
	{
		return {
			'updateSingleProperty': [
					'module_id',
					'data_id',
					'key',
					'value'
				],
			'updateDataIdProperties': [
					'module_id',
					'data_id',
					'data'
				],
			'removeDataId': [
					'module_id',
					'data_id'
				],
		}
	},

	has: function (id)
	{
		return this.getIdRules().hasOwnProperty(id)
	},

	new: function(id, data)
	{
		if (!this.has(id))
			return false

		var modelWithRules = {}
		StackMaster.loop(this.getIdRules()[id], function(index, rule){
			if (data.hasOwnProperty(rule))
				modelWithRules[rule] = data[rule]
			else modelWithRules[rule] = null
		}, this)
		modelWithRules.model_id = id
		return modelWithRules
	}

}

if (typeof module != 'undefined')
	module.exports = ModelMaster