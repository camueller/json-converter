const specOn = '$on';
const specFilter = '$filter';
const specKeywords = [specOn, specFilter];
const fieldNameObject = '$object';
const fieldNameArray = '$array';


function getMappingKeys(mapping) {
    return Object.keys(mapping).filter(key => !specKeywords.includes(key));
}

function getField(mappingSpec, specOnValue, on) {
    return `${on ? on + '.' : ''}${specOnValue ? specOnValue + '.' : ''}${mappingSpec[0]}`;
}

function readValue(source, mappingSpec, specOnValue, on) {
    console.log('readValue: parsed=', source);
    console.log('readValue: mappingSpec=', mappingSpec);
    console.log('readValue: specOnValue=', specOnValue);
    let field = getField(mappingSpec, specOnValue, on);
    console.log('readValue: field=', field);
    const srcHierarchy = field.split('.');    
    let srcElement = source;
    for(let i=0; i<srcHierarchy.length - 1; i++) {
        srcElement = srcElement[srcHierarchy[i]];
    }
    console.log('readValue: srcElement=', srcElement);
    const srcElementKey = srcHierarchy[srcHierarchy.length - 1];    
    console.log('readValue: srcElementKey=', srcElementKey);
    const value = srcElement[srcElementKey];
    console.log('readValue: value=', value);

    return value;
}

function readValueAndProcess(source, mappingSpec, specOnValue, on) {
    const field = getField(mappingSpec, specOnValue, on);
    if(field === fieldNameObject || field === fieldNameArray) {
        return mappingSpec[1];
    }
    const value = readValue(source, mappingSpec, specOnValue, on);
    if(mappingSpec.length > 1) {
        const mappingFunc = mappingSpec[1];
        console.log('readValueAndProcess: mappingFunc=', mappingFunc);
        return mappingFunc(value);
    }
    return value;
}

function mapFrom(source, mapping, on, target) {
    console.log('mapFrom: source=', source);
    console.log('mapFrom: mapping=', mapping);
    console.log('mapFrom: target=', target);
    const specOnValue = mapping[specOn];
    console.log('mapFrom: specOnValue=', specOnValue);

    const sourceOrSpecOn = source[specOnValue] ?? source;
    console.log('mapFrom: sourceOrSpecOn=', sourceOrSpecOn);
    const mappingKeys = getMappingKeys(mapping);
    if(Array.isArray(sourceOrSpecOn)) {
        for(let i=0; i<sourceOrSpecOn.length; i++) {
            const sourceElement = source[specOnValue][i];
            console.log('mapFrom: sourceElement=', sourceElement);

            const specFilterValue = mapping[specFilter];
            // console.log('mapFrom: specFilterValue=', specFilterValue);
            if(specFilterValue) {
                const filterValue = readValue(sourceElement, specFilterValue, undefined, undefined);
                // console.log('mapFrom: filterValue=', filterValue);
                const filterFunc = specFilterValue[1];
                if(!filterFunc(filterValue)) {
                    // console.log('mapFrom: continue');
                    continue;
                }
            }

            const result = {};
            Array.from(mappingKeys).forEach(key => {
                // console.log('mapFrom: key=', key);
                const mappingSpec = mapping[key];
                // console.log('mapFrom: mappingSpec=', mappingSpec);
                result[key] = readValueAndProcess(sourceElement, mappingSpec, undefined, on);
            });
            target.push(result);
        }
        // console.log('mapFrom: targetWithResult=', target);
    } else {
        Array.from(mappingKeys).forEach(mappingKey => {
            console.log('mapFrom: mappingKey=', mappingKey);
            const targetHierarchy = mappingKey.split('.');
            const targetKey = targetHierarchy[targetHierarchy.length - 1];
            console.log('mapFrom: targetKey=', targetKey);
            target[targetKey] = readValueAndProcess(source[specOnValue] ?? source, mapping[mappingKey], specOnValue, on);
            console.log('mapFrom: target(after readValue)=', target);
        });
    }
}

function mapTo(source, mapping, on, target) {
    console.log('mapTo: ============================');
    console.log('mapTo: source=', source);
    console.log('mapTo: mapping=', mapping);
    console.log('mapTo: target=', target);
    const hasKeyWithMappingSpec = Object.keys(mapping).some(key => Array.isArray(mapping[key]));
    console.log('mapTo: hasKeyWithMappingSpec=', hasKeyWithMappingSpec);
    const mappingKey = getMappingKeys(mapping)[0];
    console.log('mapTo: mappingKey=', mappingKey);
    if(hasKeyWithMappingSpec) {
        const destHierarchy = mappingKey.split('.');
        let targetDescendant = target;
        for(let i=0; i<destHierarchy.length - 1; i++) {
            const next = targetDescendant[destHierarchy[i]] ?? {};
            targetDescendant[destHierarchy[i]] = next;
            targetDescendant = next;
        }
        mapFrom(source, mapping, on, targetDescendant);
    } else {
        const specOnValue = mapping[specOn];
        // console.log('mapTo: specOnValue=', specOnValue);

        const childMapping = mapping[mappingKey];
        // console.log('mapTo: childMapping=', childMapping);

        if(specOnValue) {
            // keep mapping[specOn] by adding it to childMapping[specOn]
            if(childMapping[specOn]) {
                childMapping[specOn] = `${specOnValue}.${childMapping[specOn]}`;
            } else {
                childMapping[specOn] = specOnValue;
            }
        }
        // console.log('mapTo: childMapping(after mod4keep)=', childMapping);

        const sourceOrSpecOn = source[childMapping[specOn]] ?? source;
        // console.log('mapTo: sourceOrSpecOn=', sourceOrSpecOn);

        const child = Array.isArray(sourceOrSpecOn) ? [] : {};
        target[mappingKey] = child;

        mapTo(source, childMapping, on, child);
    }
}

export function json_converter(json, mapping, on) {
    const parsed = JSON.parse(json);
    const result = Array.isArray(parsed[mapping[specOn]]) ? [] : {};
    mapTo(parsed, mapping, on, result);
    console.log('RESULT=', result);
    return result;
}

module.exports = {json_converter};
