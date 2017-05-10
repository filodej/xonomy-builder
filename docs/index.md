# Xonomy Builder Documentation

## Schema conversion

A *Source Schema* can be converted to *Xonomy Schema* as follows:

```js
var xschema = XonomyBuilder.convertSchema(schema);
```

With *Xonomy Schema* users can instantiate *Xonomy Editor* as usual:

```js
var xmarkup = "<root version='0.1'/>";
var xonomy = document.getElementById("xonomy");
Xonomy.render(xmarkup, xonomy, xschema);
```

## API Documentation

### Schema

| Property   | Type     | Default | Description |
| ---------- | -------- | ------- | ----------- |
| types      | array    | []      | List of [Type Declarations](#type-declaration) |
| elements   | array    | -       | List of [Element Declarations](#element-declaration) |
| namespaces | object   | {}      | Map of [Namespace Declarations](#namespace-declaration) |
| onchange   | function | null    | Callback function to be called on any change |
| validate   | function | null    | Custom validation function called on any change  |
| unknown    | function | null    | Function returning specification for unknown element or attribute |

### Element Declaration

| Property   | Type     | Default | Description |
| ---------- | -------- | ------- | ----------- |
| attributes | array    | []      | List of [Attribute Declarations](#attribute-declaration) |
| children   | array    | []      | List of child [Element References](#element-reference) |
| wrappers   | array    | []      | ... | 
| validate   | function | null    | Custom validation function for this element |
| menu       | array    | []      | List of [Menu Items](#menu-item) |
| text       | boolean  | false   | Determines if this is a text element |
| before     | array    | []      | Array of siblings which can be before this element |
| after      | array    | []      | Array of siblings which can be after this element |
| order      | boolean  | false   | If true then order of siblings matters |

### Attribute Declaration

| Property   | Type     | Default      | Description |
| ---------- | -------- | ------------ | ----------- |
| name       | string   | -            | Name of the *Attribute* |
| caption    | string   | 'Add @'+name | ... |
| value      | string   | '?'          | Default value when a new attribute is added |
| type       | string   | ''           | [Attribute Type](#type-declaration) Reference |
| group      | string   | ''           | Name of a group if user wants to group attributes in menu |
| condition  | function | null         | A predicate determining a presence of conditional attribute  |
| mandatory  | boolean  | false        | Mandatory attributes are created automatically and cannot be deleted |
| menu       | array    | []           | List of [Menu Items](#menu-item) |

### Namespace Declaration

XML namespace consists of following parts:

- Namespace prefix ... local alias representing the namespace in current scope (e.g. `xmlns:svg`)
- Namespace name ... global namespace URI (e.g. `http://www.w3.org/2000/svg`)

### Element Reference

| Property   | Type     | Default          | Description |
| ---------- | -------- | ---------------- | ----------- |
| name       | string   | -                | Name of the referenced [Element](#element-declaration) |
| caption    | string   | 'Add <'+name+'>' | ... |
| max        | integer  | Infinity         | Maximal number of elements for a particular parent |
| condition  | function | null             | A predicate determining a presence of conditional element |
| group      | string   | ''               | Name of a group if user wants to group elements in menu |
| 

### Type Declaration

| Property   | Type           | Default | Description |
| ---------- | -------------- | ------- | ----------- |
| validate   | regex|function | null    | Custom regular expression or function validating attribute value |
| asker      | array|function | null    | Array of valid options or a custom asker function |

### Menu Item

| Property   | Type     | Default | Description |
| ---------- | -------- | ------- | ----------- |
| caption    | string   | -       | Caption for the menu item |
| action     | function | null    | Function called when menu item is triggered  |
| parameter  | anything | null    | Parameter passed to the action function |
| menu       | array    | []      | List of [Sub-Menu Items](#menu-item) (*action* must be null) |

## Schema Examples

### Basic Hierarchy

*Source schema* representing a basic XML hierarchy can look as follows:

```js
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
```

... and leads to following editor configuration:

<iframe src="https://rawgit.com/filodej/xonomy-builder/master/examples/basic/index.html" 
		width="100%" height="200px" style="background-color:#f6f8fa;">&nbsp;</iframe>

Menus for element and attribute insertion and deletion and drag & drop rules are deduced 
and specified automatically from given schema.

Note the following facts:

- The `root` element cannot be deleted
- The `root/@version` attribute cannot be deleted
- There can at most one `first` sub-element
- There can at most two `second` sub-elements
- The `first/@b` attribute is mandatory and so is inserted automatically
- Elements `second` are always after `first` element (even if they are inserted sooner)

### Attribute Types

*Source schema* can be extended by adding attribute types:

```js
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
```

It then leads to following editor configuration:

<iframe src="https://rawgit.com/filodej/xonomy-builder/master/examples/types/index.html" 
		width="100%" height="200px" style="background-color:#f6f8fa;">&nbsp;</iframe>

Types influence individual attribute askers as well as attribute validation.

Note the following facts:

- The `boolean` type of attribute `@a` allows only `true` or `false` value 
  - `asker` does not provide another possibility
  - `validate` is computed automatically based on list of valid options
- The `length` type of attribute `@b` provides a set of pre-defined values, but allows more
  - `asker` array contains `null` and so allows an open set of values
  - `validate` specifies regular expression used for validation

### Menu

If we extend the *Source schema* with custom menu definition:

```js
function setMode(htmlID, mode) {
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
                {caption: "Nerd mode", action: setMode, parameter: 'nerd', condition: ()=>Xonomy.mode==='laic'},
                {caption: "Laic mode", action: setMode, parameter: 'laic', condition: ()=>Xonomy.mode==='nerd'}
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
```
... then we can perform a custom action like changing the Xonomy editor mode from *Nerd* to *Laic* 
	(or anything else):

<iframe src="https://rawgit.com/filodej/xonomy-builder/master/examples/menu/index.html" 
		width="100%" height="200px" style="background-color:#f6f8fa;">&nbsp;</iframe>


### Namespaces

There is a support for XML namespaces. 
For example a *Source schema* for a simple SVG editor can look as follows:

```js
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
            menu: [
                {caption: "Nerd mode", action: setEditorMode, parameter: 'nerd', condition: () => Xonomy.mode === 'laic'},
                {caption: "Laic mode", action: setEditorMode, parameter: 'laic', condition: () => Xonomy.mode === 'nerd'}
            ],
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
```
It leads to following editor configuration:

<iframe src="https://rawgit.com/filodej/xonomy-builder/master/examples/namespaces/index.html" 
		width="100%" height="200px" style="background-color:#f6f8fa;">&nbsp;</iframe>

### Validation

@TBD

### Preprocessing

@TBD

### Postprocessing

@TBD
