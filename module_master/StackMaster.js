var StackMaster = {
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
		{
			delete this.get()[id]
			return true
		}
		return false
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

	for: function(callback, context)
	{
		var items = this.get()
		this.loop(items, callback, context)
	},

	loop: function(items, callback, context)
	{
		for (id in items)
		{
			if (!items.hasOwnProperty(id))
				continue

			callback.call(context, id, items[id], items)
		}
	}
}

if (typeof module != 'undefined')
	module.exports = StackMaster