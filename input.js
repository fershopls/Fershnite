(function() {
    var pressedKeys = {};

    document.addEventListener('keydown', function(e) {
        input.setKey(e, true);
    });

    document.addEventListener('keyup', function(e) {
        input.setKey(e, false);
    });

    window.addEventListener('blur', function() {
        pressedKeys = {};
    });

    window.input = {
        isDown: function(key) {
            return pressedKeys[key.toUpperCase()];
        },

        getCodeFromAscii: function (code)
        {
            return String.fromCharCode(code);
        },

        setKey: function (event, status) {
            var code = event.keyCode;
            var key;

            switch(code) {
            case 32:
                key = 'SPACE'; break;
            case 37:
                key = 'LEFT'; break;
            case 38:
                key = 'UP'; break;
            case 39:
                key = 'RIGHT'; break;
            case 40:
                key = 'DOWN'; break;
            default:
                // Convert ASCII codes to letters
                key = this.getCodeFromAscii(code);
            }

            pressedKeys[key] = status;
        },
    };
})();