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

| Property   | Type   | Default | Description |
| -------- | -------- | ------- | ----------- |
| types    | array    | []      | List of [Type Declarations](#type-declaration) |
| elements | array    | -       | List of [Element Declarations](#element-declaration) |
| onchange | function | null    | Callback function to be called on any change |
| validate | function | null    | Custom validation function called on any change  |
| unknown  | function | null    | Function returning specification for unknown element or attribute |

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

Meta-schema representing a basic XML hierarchy can look as follows:

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

