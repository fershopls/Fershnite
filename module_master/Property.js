def = (function(v, d) { return typeof v=='undefined'?d:v })
function Property (id, default_value, allow_sync, allow_sync_client_update)
{
	this.id = id
	this.default_value = def(default_value, null)
	this.allow_sync = def(allow_sync, false)
	this.allow_sync_client_update = def(allow_sync_client_update, false)
}

if (typeof module != 'undefined')
	module.exports = Property
else
	window.Property = Property