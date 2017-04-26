'use strict';

var schema = {
    elements: {  
        root: {
            attributes: [
                {name: 'version', mandatory: true}
            ],
            children: [
                {name: 'first', max: 1},
                {name: 'second',  max: 2}
            ]
         },
        first: {
            attributes: [
                {name: 'a', mandatory: true},
                'b'
            ],
            order: true
        },
        second: {
            attributes: ['c'],
            order: true
        }
    }
};

function init_editor() {
    var xschema = XonomyBuilder.convertSchema(schema);
    var xmarkup = XonomyBuilder.xml('root', {version: '0.1'});
	var xonomy = document.getElementById("xonomy");
	Xonomy.render(xmarkup, xonomy, xschema);
    //Xonomy.setMode('laic');
}
