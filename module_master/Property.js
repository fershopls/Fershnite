def = (function(v, d) { return typeof v=='undefined'?d:v })
function Property (id, default_value, allow_sync, broadcastable, updateValidator)
{
	this.id = id
	this.default_value = def(default_value, null)
	this.allow_sync = def(allow_sync, false)
	this.broadcastable = def(broadcastable, false)
	this.updateValidator = def(updateValidator, null)
}

if (typeof module != 'undefined')
	module.exports = Property
else
	window.Property = Property