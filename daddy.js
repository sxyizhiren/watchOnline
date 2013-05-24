
function start(jsName)
{
    console.log('Daddy Process Is Running.');
    var ls = require('child_process').spawn('node', [jsName]);
    ls.stdout.on('data', function (data)
    {
        console.log(data.toString());
    });
    ls.stderr.on('data', function (data)
    {
        console.log(data.toString());
    });
    ls.on('exit', function (code)
    {
        console.log('Child Process Exited With Code ' + code);
        delete(ls);
        setTimeout(start,5000,jsName);
    });

}

start('core/main.js');