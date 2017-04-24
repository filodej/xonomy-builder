var XonomyBuilder = {};

XonomyBuilder.validator = function(xschema) {
    return function(jsElement) {
        //Validate the element:
        var elementSpec = xschema.elements[jsElement.name];
        if(elementSpec.validate)
            elementSpec.validate(jsElement);
        //Cycle through the element's attributes:
        jsElement.attributes.forEach(function(jsAttribute) {
            var attributeSpec = elementSpec.attributes[jsAttribute.name];
            if(attributeSpec.validate)
                attributeSpec.validate(jsAttribute);
        });
        //Cycle through the element's children:
        jsElement.children.forEach(function (jsChild) {
            if(jsChild.type === 'element') {
                xschema.validate(jsChild);
            }
        });
    };
};

XonomyBuilder.unknownElement = function(elementName) {
    var menu = [];
	menu.push({caption: 'Delete <' + elementName + '>', action: Xonomy.deleteElement});
    return {menu: menu};
};

XonomyBuilder.unknownAttribute = function(elementName, attributeName) {
    var menu = [];
    menu.push({caption: 'Delete @' + attributeName, action: Xonomy.deleteAttribute});
    return {menu: menu};
};

XonomyBuilder.convertSpec = function(self, def, schema) {
	var result = {};
	var parents = _findHolders(self, schema, 'children');
	var holders = _findHolders(self, schema, 'wrappers');
    var owners = parents.concat(holders);	
	var menu = [];

    function _isString(arg) {
	    return typeof arg === 'string';
    }

    function _findKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    }
    
    function _getMandatoryAttrs(spec) {
        var attrs = ( spec && spec.attributes ) || [];
        var result = {};
        attrs.forEach(function (attr) {
            if (attr.mandatory)
                result[attr.name] = attr.value || '?';
        });
        return result;
    };

    function _getReferences( spec, key ) {
	    return spec[key]
		    ? spec[key].map(function (child) { return _isString(child) ? child : child.name; })
	    : [];
    }

    function _findHolders( self, schema, type ) {
	    var holders = [];
	    Object.keys(schema.elements).forEach(function (key) {
		    var spec = schema.elements[key];
		    var siblings = _getReferences( spec, type );
		    if (siblings.indexOf(self) != -1)
			    holders.push(spec);
	    });
	    return holders;
    }

    function _hideIfAll(items) {
        items = items.filter( (item) => item.hideIf );
        return function (js) {
            return items.every( (item) => item.hideIf(js) );  
        }
    }

    function _elementValidator(def) {
        function _validateChildren(jsElement, allowedElems) {
            jsElement.children.forEach(function (child) {
                if (child.type === 'element') {
                    var allowed = allowedElems.filter( (el) => !el.condition || el.condition(jsElement) ).map( (el) => el.name );
                    if (allowed.indexOf(child.name) === -1)
                        Xonomy.warnings.push({ htmlID: child.htmlID, 
                                               text: "Unexpected element (allowed: "+allowed.join(', ')+")."});
                }
            });
        }

        function _validateAttrs(jsElement, allowedAttrs) {
            jsElement.attributes.forEach(function (jsAttribute) {
                var allowed = allowedAttrs
                    .filter( (attr) => !attr.condition || attr.condition(jsElement) )
                    .map( (attr) => attr.name );
                if (allowed.indexOf(jsAttribute.name) === -1)
                    Xonomy.warnings.push({ htmlID: jsAttribute.htmlID, 
                                           text: "Unexpected attribute (allowed: "+allowed.join(', ')+")."});
            });
            var missing = [];
            allowedAttrs.forEach(function(attr) {
                if (attr.mandatory && !jsElement.getAttribute(attr.name)) {
                    if (!attr.condition || attr.condition(jsElement))
                        missing.push(attr.name);
                }
            });
            if (missing.length)
                Xonomy.warnings.push({ htmlID: jsElement.htmlID, text: "Missing mandatory attributes: "+missing.join(', ')+"."});
        }

        var validators = [];
        if (def.validate)
            validators.push(def.validate);

        if (def.attributes) {
            var all = def.attributes.map( (attr) => _isString(attr) ? {name: attr} : attr );
            validators.push( (jsElement) => _validateAttrs(jsElement, all) );
        }
        
        if (def.children !== null || def.wrappers) {
            var tags = [];
            if (def.children)
                tags = def.children.map( (el) => _isString(el) ? {name: el} : el );
            if (def.wrappers)
                tags = tags.concat(def.wrappers.map( (el) => _isString(el) ? {name: el} : el ));
            validators.push((jsElement) => _validateChildren(jsElement, tags) );
        }

        if (validators.length > 1)
            return (jsElement) => validators.forEach( (validator) => validator(jsElement) ); 
	    return validators.length 
            ? validators[0] 
            : function() {};
    }

	if (holders.length) {
		menu.push({
			caption: 'Unwrap <' + self + '>',
			action: Xonomy.unwrap,
		});
	} else if (parents.length) {
		menu.push({
			caption: 'Delete <' + self + '>',
			action: Xonomy.deleteElement,
		});
	}

    if (def.menu) {
        menu = menu.concat(def.menu);
    }

    var attrMenu = [];
	if (def.attributes) {
        var groups = [];
		def.attributes.forEach(function(spec) {
			if (_isString(spec)) {
				spec = {name: spec};
            }
			var value = spec.value || '?';
			var item = {
				caption: spec.caption || 'Add @' + spec.name + '="' + value + '"',
				action: Xonomy.newAttribute,
				actionParameter: {name: spec.name, value: value},
			};
            item.hideIf = function (jsElement) {
                if (jsElement.hasAttribute(spec.name))
                    return true;
                if (spec.condition && !spec.condition(jsElement))
                    return true;
                return false;
            };
            var id = spec.group || '';
            var group = groups.find((group) => group.id === id );
            if (group)
                group.menu.push(item);
            else
                groups.push({id: group, menu: [item]});
		});
        groups.forEach(function(group) {
            if (group.id) {
                attrMenu.push( {caption: 'Add '+group.id, menu: group.menu, hideIf: _hideIfAll(group.menu)} );
            } else {
                attrMenu = attrMenu.concat(group.menu);
            }
        });

		result.attributes = {};
		def.attributes.forEach(function (spec) {
			var name = _isString(spec) ? spec : spec.name;
            var att = { asker: Xonomy.askString };

            if (spec.type) {
                var type = schema.types[spec.type];
                if (!type)
                    throw new Error("Invalid type: "+spec.type);
                if (type.validate) {
                    if (type.validate instanceof RegExp)
                        att.validate = function(jsAttribute) { validate_attr(jsAttribute, type.validate, spec.type); }
                    else
                        att.validate = type.validate;
                }
                if (type.asker)
                    att.asker = type.asker;
                else if (type.options) {
                    att.asker = type.options.indexOf(null) == -1 ? Xonomy.askPicklist: Xonomy.askOpenPicklist;
                    att.askerParameter = type.options.filter((opt) => opt !== null);
                }
            }
            if (!spec.mandatory)
                att.menu = [{ caption: 'Delete @' + name, action: Xonomy.deleteAttribute }];
            if (spec.menu)
                att.menu = att.menu.concat(spec.menu);
            result.attributes[name] = att;
		});
	}
    var childrenMenu = [];
	if (def.children) {
        var groups = [];
		def.children.forEach(function(spec) {
			if (_isString(spec))
				spec = {name: spec};
			var item = {
				caption: spec.caption || 'Add <' + spec.name + '>',
				action: Xonomy.newElementChild,
				actionParameter: xml(spec.name, _getMandatoryAttrs(schema.elements[spec.name])),
			};
			item.hideIf = function (jsElement) {
				if (spec.max && jsElement.getChildElements(spec.name).length >= spec.max)
                    return true;
                if (spec.condition && !spec.condition(jsElement))
                    return true;
                return false;
			};
            var id = spec.group || '';
            var group = groups.find((group) => group.id === id );
            if (group)
                group.menu.push(item);
            else
                groups.push({id: id, menu: [item]});
		});
        groups.forEach(function(group) {
            if (group.id) {
                childrenMenu.push({caption: 'Add '+group.id+' ...', menu: group.menu, hideIf: _hideIfAll(group.menu)});
            } else {
                childrenMenu = childrenMenu.concat(group.menu);
            }
        });
	}

    if (menu.length + attrMenu.length + childrenMenu.length > 8) {
        menu.push({caption: "Add @attribute ...", menu: attrMenu, hideIf: _hideIfAll(attrMenu)});
        if (childrenMenu.length > 2)
            menu.push({caption: "Add <element> ...", menu: childrenMenu, hideIf: _hideIfAll(childrenMenu)});
        else
            menu = menu.concat(childrenMenu);
    } else {
        menu = menu.concat(attrMenu).concat(childrenMenu);
    }

	if (def.wrappers) {
		result.inlineMenu = def.wrappers.map(function(wrapper) {
            if (_isString(wrapper))
                wrapper = {name: wrapper};
            if (!wrapper.placeholder)
                wrapper.placeholder = '$';
            if (wrapper.template === undefined)
                wrapper.template = xml(wrapper.name, {}, wrapper.placeholder);
			var result = {
				caption: "Wrap with <"+wrapper.name+">",
				action: Xonomy.wrap,
				actionParameter: {template: wrapper.template, placeholder: wrapper.placeholder}
			};
            if (wrapper.condition)
                result.hideIf = (js) => !wrapper.condition(js);
            return result;
		});
	}

	result.menu = menu;
	var before = def.before || [];
	var after = def.after || [];
	if (def.order) {
		parents.forEach(function (parent) {
			var siblings = _getReferences(parent, 'children');
			var index = siblings.indexOf(self);
			after = after.concat(siblings.slice(0, index));
			before = before.concat(siblings.slice(index+1));
		});
	}
	if (before.length)
		result.mustBeBefore = before;
	if (after.length)
		result.mustBeAfter = after;
	if (def.text)
		result.hasText = def.text;
	if (def.oneline)
		result.oneliner = def.oneline;
	if (def.collapsed)
		result.collapsed = def.collapsed;
    if (def.readonly)
        result.isReadOnly = def.readonly;

    if (owners.length) {
	    result.canDropTo = owners.map( (owner) => _findKeyByValue(schema.elements, owner) );
    }
    result.validate = _elementValidator(def);
	return result;
};

XonomyBuilder.convertSchema = function(schema) {
	var xschema = {};
    xschema.onchange = schema.onchange || function() {};
	xschema.elements = {};
    Object.keys(schema.elements).forEach(function (key) {
		var spec = schema.elements[key];
		var xspec = XonomyBuilder.convertSpec(key, spec, schema);
		xschema.elements[key] = xspec;
	});
    xschema.validate = schema.validate || XonomyBuilder.validator(xschema);
    xschema.unknownElement = schema.unknownElement || XonomyBuilder.unknownElement;
    xschema.unknownAttribute = schema.unknownAttribute || XonomyBuilder.unknownAttribute;
	return xschema;
};

