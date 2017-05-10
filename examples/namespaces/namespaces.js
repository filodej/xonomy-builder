'use strict';

var schema = {
    namespaces: {
        'xmlns:svg': 'http://www.w3.org/2000/svg'
    },
    types: {
        length : { 
            asker: ['10pt', '10px', '10in', '10mm', '10%', null],
            validate: /^[+-]?([0-9]*\.)?[0-9]+(pt|px|in|pc|mm|cm|em|%)$/
        }
    },
    elements: {  
        'svg:svg': {
            attributes: [
                {name: 'version', mandatory: true},
                'width',
                'height'
            ],
            children: ['svg:g', 'svg:rect', 'svg:circle'],
        },
        'svg:g': {
            children: ['svg:g', 'svg:rect', 'svg:circle'],
        },
        'svg:rect': {
            attributes: [
                {name:'x', type:'length'},
                {name:'y', type:'length'},
                {name:'width', type:'length', mandatory:true},
                {name:'height', type:'length', mandatory:true},
                'style'
            ]
        },
        'svg:circle': {
            attributes: [
                {name:'cx', type:'length'},
                {name:'cy', type:'length'},
                {name:'r', type:'length', mandatory:true},
                'style'
            ]
        }
    }
};

function init_editor() {
    var xschema = XonomyBuilder.convertSchema(schema);
    var xmarkup = XonomyBuilder.xml('svg:svg', {version: '1.0'}, '', schema.namespaces);
    var xonomy = document.getElementById("xonomy");
    Xonomy.render(xmarkup, xonomy, xschema);
    //Xonomy.setMode('laic');
}
