const specOn = '$on';
const specAny = '$any';
const specAnyKey = 'key';
const specFilter = '$filter';
const specToArray = '$toArray';
const specKeywords = [specAny, specOn, specFilter, specToArray];
const fieldNameObject = '$object';
const fieldNameArray = '$array';

function expandAnyMapping(source, mapping) {
    const keyFunc = mapping[specAny][specAnyKey];
    const srcObject = getSourceObject(source, undefined, mapping[specOn], undefined);
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

function getField(mappingSpec, specOnValue, on) {
    return `${on ? on + '.' : ''}${specOnValue ? specOnValue + '.' : ''}${!!mappingSpec ? mappingSpec[0] : ''}`;
}

function getSourceObject(source, mappingSpec, specOnValue, on) {
    const field = getField(mappingSpec, specOnValue, on);
    const srcHierarchy = field.split('.');
    let srcObject = source;
    for(let i=0; i<srcHierarchy.length - 1; i++) {
        srcObject = srcObject[srcHierarchy[i]];
    }
    return srcObject;
}

function readValue(source, mappingSpec, specOnValue, on) {
    const field = getField(mappingSpec, specOnValue, on);
    const srcHierarchy = field.split('.');    
    const srcElement = getSourceObject(source, mappingSpec, specOnValue, on);
    const srcElementKey = srcHierarchy[srcHierarchy.length - 1];
    return srcElement[srcElementKey];
}

function readValueAndProcess(source, mappingSpec, specOnValue, on, arrayIndex, arrayAllElements) {
    const field = getField(mappingSpec, specOnValue, on);
    if(field === fieldNameObject || field === fieldNameArray) {
        return mappingSpec[1];
    }
    const value = readValue(source, mappingSpec, specOnValue, on);
    if(mappingSpec.length > 1) {
        const mappingFunc = mappingSpec[1];
        return mappingFunc(value, arrayIndex, arrayAllElements);
    }
    return value;
}

function mapFrom(source, mapping, on, target) {
    const specOnValue = mapping[specOn];
    const sourceOrSpecOn = source[specOnValue] ?? source;
    const mappingKeys = getMappingKeys(mapping);
    if(Array.isArray(sourceOrSpecOn)) {
        for(let i=0; i<sourceOrSpecOn.length; i++) {
            const sourceElement = source[specOnValue][i];
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
                result[key] = readValueAndProcess(sourceElement, mappingSpec, undefined, on, i, source[specOnValue]);
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
        let targetDescendant = mapping[specToArray] ? [] : target;
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

        if(mapping[specToArray]) {
            const keyProp = mapping[specToArray][0];
            const valueProp = mapping[specToArray][1];
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

        const child = Array.isArray(sourceOrSpecOn) && !childMapping[specToArray] ? [] : {};
        target[mappingKey] = child;

        mapTo(source, childMapping, on, child);
    }
}

export function json_converter(json, mapping, on) {
    const source = JSON.parse(json);
    const result = Array.isArray(source[mapping[specOn]]) && !mapping[specToArray] ? [] : {};
    mapTo(source, mapping, on, result);
    return result;
}

module.exports = {json_converter};
