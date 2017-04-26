'use strict';

function xml(tag, attrs, text) {
	text = text || '';
	attrs = attrs || {};
	var str_attrs = Object.keys(attrs).map((key) => key + '="' + attrs[key] + '"').join(' ');
	return '<' + tag + ' ' + str_attrs + '>'+text+'</' + tag + '>';
}

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
                {name: 'b', mandatory: true},
                'c'
            ],
            order: true
        },
        second: {
            order: true
        }
    }
};

function init_editor() {
    var xschema = XonomyBuilder.convertSchema(schema);
    var xmarkup = xml('root', {version: '0.1'});
	var xonomy = document.getElementById("xonomy");
	Xonomy.render(xmarkup, xonomy, xschema);
    //Xonomy.setMode('laic');
}
