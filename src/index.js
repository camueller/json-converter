const jsonpath = require('jsonpath');

const specOn = '$on';
const specAny = '$any';
const specAnyKey = 'key';
const specFilter = '$filter';
const specArrayToObject = '$arrayToObject';
const specKeywords = [specAny, specOn, specFilter, specArrayToObject];
const fieldNameObject = '$object';
const fieldNameArray = '$array';

function expandAnyMapping(source, mapping) {
    const keyFunc = mapping[specAny][specAnyKey];
    const srcObject = value(source, mapping[specOn]);
    Object.keys(srcObject).forEach(key => {
        const transformedKey = keyFunc(key);
        if(transformedKey) {
            mapping[transformedKey] = [key];
        }
    });
    return mapping;
}

function getMappingKeys(mapping) {
    return Object.keys(mapping).filter(key => !specKeywords.includes(key));
}

function getPath(mappingSpec, specOnValue, on, arrayIndex) {
    let path = '';
    if(on) {
        path += on;
    }
    if(specOnValue) {
        if(path.length > 0) {
            path += '.';
        }
        path += specOnValue;
    }
    if(arrayIndex !== undefined) {
        path += '[' + arrayIndex + ']'
    }
    if(!!mappingSpec) {
        if(path.length > 0) {
            path += '.';
        }
        path += mappingSpec;
    }
    return path.length ? path : undefined;
}

function value(source, path) {
    return path ? jsonpath.value(source, path) : undefined;
}

function readValue(source, mappingSpec, specOnValue, on, arrayIndex) {
    const mappingSpecPathSegments = mappingSpec[0].split('.');
    const mappingSpecPathExceptLastSegment = Array.from(mappingSpecPathSegments).toSpliced(mappingSpecPathSegments.length - 1).join('.');
    const path = getPath(!specOnValue && !on ? mappingSpecPathExceptLastSegment : undefined, specOnValue, on, arrayIndex);
    const sourceElement = path ? jsonpath.value(source, path) : source;
    const sourceElementKey = mappingSpecPathSegments[mappingSpecPathSegments.length - 1];
    return mappingSpec ? sourceElement[sourceElementKey] : sourceElement;
}

function readValueAndProcess(source, mappingSpec, specOnValue, on, arrayIndex, arrayAllElements) {
    const path = getPath(mappingSpec[0], specOnValue, on, arrayIndex);
    if(path === fieldNameObject || path === fieldNameArray) {
        return mappingSpec[1];
    }
    const value = readValue(source, mappingSpec, specOnValue, on, arrayIndex);
    if(mappingSpec.length > 1) {
        const mappingFunc = mappingSpec[1];
        return mappingFunc(value, arrayIndex, arrayAllElements);
    }
    return value;
}

function mapFrom(source, mapping, on, target) {
    const specOnValue = mapping[specOn];
    const sourceOrSpecOn = value(source, specOnValue) ?? source;
    const mappingKeys = getMappingKeys(mapping);
    if(Array.isArray(sourceOrSpecOn)) {
        for(let i=0; i<sourceOrSpecOn.length; i++) {
            const sourceElement = sourceOrSpecOn[i];
            const specFilterValue = mapping[specFilter];
            if(specFilterValue) {
                const filterValue = readValue(sourceElement, specFilterValue, undefined, undefined);
                const filterFunc = specFilterValue[1];
                if(!filterFunc(filterValue)) {
                    continue;
                }
            }

            const result = {};
            Array.from(mappingKeys).forEach(key => {
                const mappingSpec = mapping[key];
                result[key] = readValueAndProcess(source, mappingSpec, specOnValue, on, i, source[specOnValue]);
            });
            target.push(result);
        }
    } else {
        Array.from(mappingKeys).forEach(mappingKey => {
            const targetHierarchy = mappingKey.split('.');
            const targetKey = targetHierarchy[targetHierarchy.length - 1];
            target[targetKey] = readValueAndProcess(source[specOnValue] ?? source, mapping[mappingKey], specOnValue, on);
        });
    }
}

function mapTo(source, mapping, on, target) {
    const hasAnySpec = !!mapping[specAny];
    const hasKeyWithMappingSpec = Object.keys(mapping).some(key => Array.isArray(mapping[key]));
    const mappingKey = getMappingKeys(mapping)[0];
    if(hasKeyWithMappingSpec || hasAnySpec) {
        const destHierarchy = mappingKey ? mappingKey.split('.') : [];
        let targetDescendant = mapping[specArrayToObject] ? [] : target;
        for(let i=0; i<destHierarchy.length - 1; i++) {
            const next = targetDescendant[destHierarchy[i]] ?? {};
            targetDescendant[destHierarchy[i]] = next;
            targetDescendant = next;
        }

        let mappingForUse = mapping;
        if(hasAnySpec) {
            mappingForUse = expandAnyMapping(source, mapping);
        }

        mapFrom(source, mappingForUse, on, targetDescendant);

        if(mapping[specArrayToObject]) {
            const keyProp = mapping[specArrayToObject][0];
            const valueProp = mapping[specArrayToObject][1];
            Array.from(targetDescendant).forEach(entry => {
                target[entry[keyProp]] = entry[valueProp];
            });
        }
    } else {
        const specOnValue = mapping[specOn];
        const childMapping = mapping[mappingKey];

        if(specOnValue) {
            // keep mapping[specOn] by adding it to childMapping[specOn]
            if(childMapping[specOn]) {
                childMapping[specOn] = `${specOnValue}.${childMapping[specOn]}`;
            } else {
                childMapping[specOn] = specOnValue;
            }
        }

        const sourceOrSpecOn = source[childMapping[specOn]] ?? source;

        const child = Array.isArray(sourceOrSpecOn) && !childMapping[specArrayToObject] ? [] : {};
        target[mappingKey] = child;

        mapTo(source, childMapping, on, child);
    }
}

export function json_converter(json, mapping, on) {
    const source = JSON.parse(json);
    const result = mapping[specOn] && Array.isArray(value(source, mapping[specOn])) && !mapping[specArrayToObject] ? [] : {};
    mapTo(source, mapping, on, result);
    return result;
}

module.exports = {json_converter};
