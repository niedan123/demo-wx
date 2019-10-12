const httpcli = require('../httpcli');

var hi = new httpcli();

hi.download('http://localhost:5678/download', {
    dir : process.env.HOME+'/downloads/',
});

