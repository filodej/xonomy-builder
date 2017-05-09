var XonomyBuilder = {};

XonomyBuilder.xml = function(tag, attrs, text, namespaces) {
    namespaces = namespaces || {};
    text = text || '';
    attrs = Object.assign({}, namespaces, attrs || {});
    var str_attrs = Object.keys(attrs).map((key) => key + '="' + attrs[key] + '"').join(' ');
    return '<' + tag + ' ' + str_attrs + '>'+text+'</' + tag + '>';
}

XonomyBuilder.isRegExp = function(re) {
    return re instanceof RegExp;
};
    
XonomyBuilder.isString = function(s) {
    return typeof s === 'string';
};

XonomyBuilder.isFunction = function(f) {
    return typeof f === 'function';
};

XonomyBuilder.isArray = Array.isArray;

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

XonomyBuilder.validateAttr = function(jsAttribute, re, type) {
    //Make sure item/@label is not an empty string:
    if(!jsAttribute.value) {
        Xonomy.warnings.push({ htmlID: jsAttribute.htmlID, text: "Cannot be empty (type '"+type+"')."});
        return false;
    }
    if (!re.test(jsAttribute.value)) {
        Xonomy.warnings.push({ htmlID: jsAttribute.htmlID, text: "Invalid format (type '"+type+"')."});
        return false;
    }
    return true;
};

XonomyBuilder.mandatoryAttrs = function(spec) {
    var attrs = ( spec && spec.attributes ) || [];
    var result = {};
    attrs.forEach(function (attr) {
        if (attr.mandatory)
            result[attr.name] = attr.value || '?';
    });
    return result;
};

XonomyBuilder.elementValidator = function(validatedSpec) {
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
    if (validatedSpec.validate)
        validators.push(validatedSpec.validate);

    if (validatedSpec.attributes) {
        var all = validatedSpec.attributes.map( (attr) => XonomyBuilder.isString(attr) ? {name: attr} : attr );
        validators.push( (jsElement) => _validateAttrs(jsElement, all) );
    }
    
    if (validatedSpec.children !== null || validatedSpec.wrappers) {
        var tags = [];
        if (validatedSpec.children)
            tags = validatedSpec.children.map( (el) => XonomyBuilder.isString(el) ? {name: el} : el );
        if (validatedSpec.wrappers)
            tags = tags.concat(validatedSpec.wrappers.map( (el) => XonomyBuilder.isString(el) ? {name: el} : el ));
        validators.push((jsElement) => _validateChildren(jsElement, tags) );
    }

    if (validators.length > 1)
        return (jsElement) => validators.forEach( (validator) => validator(jsElement) ); 
    return validators.length 
        ? validators[0] 
        : function() {};
};

XonomyBuilder.unknown = function(elementName, attributeName) {
    var menu = [];
    if (attributeName) {
        menu.push({caption: 'Delete @' + attributeName, action: Xonomy.deleteAttribute});
    } else {
        menu.push({caption: 'Delete <' + elementName + '>', action: Xonomy.deleteElement});
    }
    return {menu: menu};
};

XonomyBuilder.convertSpec = function(elementName, elementSpec, schema) {
    var result = {};
    var parents = _findHolders(elementName, schema, 'children');
    var holders = _findHolders(elementName, schema, 'wrappers');
    var owners = parents.concat(holders);   
    var menu = [];

    function _findKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    }
    
    function _getReferences(spec, key) {
        return spec[key]
            ? spec[key].map(function (child) { return XonomyBuilder.isString(child) ? child : child.name; })
        : [];
    }

    function _findHolders(elementName, schema, type) {
        var holders = [];
        Object.keys(schema.elements).forEach(function (key) {
            var spec = schema.elements[key];
            var siblings = _getReferences(spec, type);
            if (siblings.indexOf(elementName) != -1)
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

    function _mapMenuItem(item) {
        return {
            caption: item.caption,
            action: item.action,
            actionParameter: item.parameter,
            hideIf: (jsElement) => item.condition && !item.condition(jsElement)
        };
    }

    if (holders.length) {
        menu.push({
            caption: 'Unwrap <' + elementName + '>',
            action: Xonomy.unwrap,
        });
    } else if (parents.length) {
        menu.push({
            caption: 'Delete <' + elementName + '>',
            action: Xonomy.deleteElement,
        });
    }

    if (elementSpec.menu) {
        menu = menu.concat(elementSpec.menu.map(_mapMenuItem));
    }

    var attrMenu = [];
    if (elementSpec.attributes) {
        var groups = [];
        elementSpec.attributes.forEach(function(attributeSpec) {
            if (XonomyBuilder.isString(attributeSpec)) {
                attributeSpec = {name: attributeSpec};
            }
            var value = attributeSpec.value || '?';
            var item = {
                caption: attributeSpec.caption || 'Add @' + attributeSpec.name + '="' + value + '"',
                action: Xonomy.newAttribute,
                actionParameter: {name: attributeSpec.name, value: value},
            };
            item.hideIf = function (jsElement) {
                if (jsElement.hasAttribute(attributeSpec.name))
                    return true;
                if (attributeSpec.condition && !attributeSpec.condition(jsElement))
                    return true;
                return false;
            };
            var id = attributeSpec.group || '';
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
        elementSpec.attributes.forEach(function (attributeSpec) {
            var name = XonomyBuilder.isString(attributeSpec) ? attributeSpec : attributeSpec.name;
            var att = { asker: Xonomy.askString };

            if (attributeSpec.type) {
                var type = schema.types[attributeSpec.type];
                if (!type)
                    throw new Error("Invalid type: "+attributeSpec.type);
                if (type.asker) {
                    if (XonomyBuilder.isFunction(type.asker))
                        att.asker = type.asker;
                    else {
                        att.asker = type.asker.indexOf(null) === -1 ? Xonomy.askPicklist: Xonomy.askOpenPicklist;
                        att.askerParameter = type.asker.filter((opt) => opt !== null);
                    }
                }
                if (type.validate) {
                    if (XonomyBuilder.isRegExp(type.validate))
                        att.validate = function(jsAttribute) { XonomyBuilder.validateAttr(jsAttribute, type.validate, attributeSpec.type); }
                    else
                        att.validate = type.validate;
                } else if (XonomyBuilder.isArray(type.asker)) {
                    if (type.asker.indexOf(null) == -1) {
                        // create validation regex based on array of options
                        var re = new RegExp('^('+type.asker.join('|')+')$');
                        att.validate = function(jsAttribute) { XonomyBuilder.validateAttr(jsAttribute, re, attributeSpec.type); }
                    }
                }
                
            }
            if (!attributeSpec.mandatory)
                att.menu = [{ caption: 'Delete @' + name, action: Xonomy.deleteAttribute }];
            if (attributeSpec.menu)
                att.menu = att.menu.concat(attributeSpec.menu.map(_mapMenuItem));
            result.attributes[name] = att;
        });
    }
    var childrenMenu = [];
    if (elementSpec.children) {
        var groups = [];
        elementSpec.children.forEach(function(childSpec) {
            if (XonomyBuilder.isString(childSpec))
                childSpec = {name: childSpec};
            var item = {
                caption: childSpec.caption || 'Add <' + childSpec.name + '>',
                action: Xonomy.newElementChild,
                actionParameter: XonomyBuilder.xml(childSpec.name, XonomyBuilder.mandatoryAttrs(schema.elements[childSpec.name]), '', schema.namespaces),
            };
            item.hideIf = function (jsElement) {
                if (childSpec.max && jsElement.getChildElements(childSpec.name).length >= childSpec.max)
                    return true;
                if (childSpec.condition && !childSpec.condition(jsElement))
                    return true;
                return false;
            };
            var id = childSpec.group || '';
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

    if (elementSpec.wrappers) {
        result.inlineMenu = elementSpec.wrappers.map(function(wrapper) {
            if (XonomyBuilder.isString(wrapper))
                wrapper = {name: wrapper};
            if (!wrapper.placeholder)
                wrapper.placeholder = '$';
            if (wrapper.template === undefined)
                wrapper.template = XonomyBuilder.xml(wrapper.name, {}, wrapper.placeholder, schema.namespaces);
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
    var before = elementSpec.before || [];
    var after = elementSpec.after || [];
    if (elementSpec.order) {
        parents.forEach(function (parent) {
            var siblings = _getReferences(parent, 'children');
            var index = siblings.indexOf(elementName);
            after = after.concat(siblings.slice(0, index));
            before = before.concat(siblings.slice(index+1));
        });
    }
    if (before.length)
        result.mustBeBefore = before;
    if (after.length)
        result.mustBeAfter = after;
    if (elementSpec.text)
        result.hasText = elementSpec.text;
    if (elementSpec.oneline)
        result.oneliner = elementSpec.oneline;
    if (elementSpec.collapsed)
        result.collapsed = elementSpec.collapsed;
    if (elementSpec.readonly)
        result.isReadOnly = elementSpec.readonly;

    if (owners.length) {
        result.canDropTo = owners.map( (owner) => _findKeyByValue(schema.elements, owner) );
    }
    result.validate = XonomyBuilder.elementValidator(elementSpec);
    return result;
};

XonomyBuilder.convertSchema = function(schema, preprocess, postprocess) {
    preprocess = preprocess || function(elementName, elementSpec, schema) { return elementSpec; };
    postprocess = postprocess || function(elementName, xonomySpec, schema) { return xonomySpec; };
    var xschema = {};
    xschema.onchange = schema.onchange || function() {};
    xschema.elements = {};
    Object.keys(schema.elements).forEach(function (elementName) {
        var elementSpec = schema.elements[elementName];
        elementSpec = preprocess(elementName, elementSpec, schema);
        var xspec = XonomyBuilder.convertSpec(elementName, elementSpec, schema);
        xspec = postprocess(elementName, xspec, schema);
        xschema.elements[elementName] = xspec;
    });
    xschema.validate = schema.validate || XonomyBuilder.validator(xschema);
    xschema.unknownElement = schema.unknown || XonomyBuilder.unknown;
    xschema.unknownAttribute = schema.unknown || XonomyBuilder.unknown;
    return xschema;
};

