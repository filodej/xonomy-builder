# Xonomy Builder
Schema builder for [xonomy](https://github.com/michmech/xonomy) editor

## Examples

User creates a meta-schema and converts it to xonomy schema as follows:

```js
var xschema = XonomyBuilder.convertSchema(schema);
var xmarkup = "<root version='0.1'/>";
var xonomy = document.getElementById("xonomy");
Xonomy.render(xmarkup, xonomy, xschema);
```

### Basic Hierarchy

Meta-schema representing a basic XML hierarchy can look as follows:

```js
schema.elements = {
	'root': {
		attributes: [
            {name: 'version', mandatory: true}
        ],
		children: ['group']
    },
	'group': {
		attributes: ['b', 'c'],
        children: [
		    { name: 'first', max: 1 },
		    { name: 'second',  max: 1 },
        ]
    },
	'first': { order: true },
	'second': { order: true },
};
```

... and leadt to following editor configuration:

<iframe src="https://rawgit.com/filodej/xonomy-builder/master/examples/basic/index.html" 
		width="640" height="480" style="display:block; margin: 0 auto;">&nbsp;</iframe>
