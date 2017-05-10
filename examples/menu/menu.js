'use strict';

function setEditorMode(htmlID, mode) {
    Xonomy.setMode(mode);
	Xonomy.clickoff();
}

var schema = {
    types: {
        boolean : { 
            asker: ['true', 'false'],
        },
        length : { 
            asker: ['10pt', '10px', '10in', '10mm', '10%', null],
            validate: /^[+-]?([0-9]*\.)?[0-9]+(pt|px|in|pc|mm|cm|em|%)$/
        }
    },
    elements: {  
        root: {
            menu: [
                {caption: "Nerd mode", action: setEditorMode, parameter: 'nerd', condition: () => Xonomy.mode === 'laic'},
                {caption: "Laic mode", action: setEditorMode, parameter: 'laic', condition: () => Xonomy.mode === 'nerd'}
            ],
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
                {name: 'a', mandatory: true, value: 'true', type: 'boolean'},
                {name: 'b', type: 'length'}
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
}
