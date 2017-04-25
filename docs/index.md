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
| onchange | function | null    | ... |
| validate | function | null    | ... |
| unknown  | function | null    | ... |

### Element Declaration

| Property   | Type     | Default | Description |
| ---------- | -------- | ------- | ----------- |
| attributes | array    | []      | List of [Attribute Declarations](#attribute-declaration) |
| children   | array    | []      | List of child [Element References](#element-reference) |
| wrappers   | array    | []      | ... | 
| validate   | function | null    | ... |
| menu       | array    | []      | List of [Menu Items](#menu-item) |
| text       | boolean  | false   | ... |
| before     | array    | []      | ... |
| after      | array    | []      | ... |
| order      | boolean  | false   | ... |

### Attribute Declaration

| Property   | Type     | Default      | Description |
| ---------- | -------- | ------------ | ----------- |
| name       | string   | -            | Name of the *Attribute* |
| caption    | string   | 'Add @'+name | ... |
| value      | string   | '?'          | ... |
| type       | string   | ''           | [Attribute Type](#type-declaration) Reference |
| group      | string   | ''           | ... |
| condition  | function | null         | ... |
| mandatory  | boolean  | false        | ... |
| menu       | array    | []           | List of [Menu Items](#menu-item) |

### Element Reference

| Property   | Type     | Default          | Description |
| ---------- | -------- | ---------------- | ----------- |
| name       | string   | -                | Name of the referenced [Element](#element-declaration) |
| caption    | string   | 'Add <'+name+'>' | ... |
| max        | integer  | Infinity         | ... |
| condition  | function | null             | ... |
| group      | string   | ''               | ... |
| 

### Type Declaration

| Property   | Type           | Default | Description |
| ---------- | -------------- | ------- | ----------- |
| validate   | regex|function | null    | ... |
| asker      | array|function | null    | ... |

### Menu Item

| Property   | Type     | Default | Description |
| ---------- | -------- | ------- | ----------- |
| caption    | string   | -       | ... |
| action     | function | null    | ... |
| parameter  | anything | null    | ... |
| menu       | array    | []      | List of [Sub-Menu Items](#menu-item) |

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
                'group'
            ]
         },
         group: {
            attributes: ['b', 'c'],
            children: [
                {name: 'first', max: 1},
                {name: 'second',  max: 1}
            ]
        },
        first: {order: true},
        second: {order: true}
    }
};
```

... and leads to following editor configuration:

<iframe src="https://rawgit.com/filodej/xonomy-builder/master/examples/basic/index.html" 
		width="100%" height="200px" style="background-color:#f6f8fa;">&nbsp;</iframe>
