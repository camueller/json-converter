`JSON Converter` is a library for translating/converting a JSON document into another JSON document with a different structure. The mapping process follows a dictionary-based specification of how fields map to the new JSON format.

`JSON Converter` is Javascript implementation of the [JSON Converter implemented in Python](https://github.com/ebi-ait/json-converter). It has the same features (and some more) and even this documentation is largely based on its relative.

The main function is `json_converter` and takes a JSON input string, a structured specification and an optional `on`parameter:

        json_converter(json_string, specification, on?)


## Mapping Specification

The general idea is that the specification describes the resulting structure of the converted JSON document. The dictionary-based specification will closely resemble the schema of the resulting JSON.

### Field Specification

A field specification is defined by a list of parameters, the first of which is a name that refers to a field in the current JSON to be converted. This is the only required field.

        <converted_field>: [<original_field>]

For example, given the sample JSON document,

        {
            "person_name": "Juan dela Cruz"
            "person_age": 37 
        }

the simplest mapping that can be done is to translate to a different field name. For example, to map `person_name` to `name` in the resulting JSON, the following specification is used:

        {
            'name': ['person_name']
        }

#### Field Chaining

JSON mapping also supports chaining of fields on either or both side of the specification. For example, using the following specification to the JSON above,

        {
            'person.name': ['person_name'],
            'person.age': ['person_age']
        }

will result in the conversion:

        {
            "person": {
                "name": "Juan dela Cruz",
                "age": 37
            }
        }

To convert back to the original JSON in the example, just reverse the field specification, for example, `'person_name': ['person.name']`. Field chaining can be done on multiple levels. However, direct field chaining for JSON array types is not supported. Processing such fields can be expressed through [anchoring](#anchoring) and [nesting](#nested-specification).

#### Post-Processing using custom functions

`JSON Converter` allows post processing of field values for more complex translation rules. This is done by specifying a custom function. It is specified after the original field name in the field specification:

        <converted_field>: [<original_field>, <post_processor function>]

`JSON Converter` will pass the value of the specified field as the argument to the post-processor. Taking the same example in the previous section, a boolean field `adult` can be added using this feature. The following spec demonstrates how this can be done:

        {
            'name': ['person_name'],
            'age': ['person_age'],
            'adult': ['person_age', (value) => value > 18]
        }

### Anchoring

While `JSON Converter` has support for field chaining, for complex JSON with several levels of nesting, combined with long field names and field list, repetitively providing full field chain can be tedious. To be able to express this more concisely, anchoring can be used. Anchoring specifies the root of the JSON structure to map to a new JSON format, relative to the actual root of the original JSON document.

#### The `on` Parameter

The `json_converter` function takes an optional parameter named `on` that can be used to specify the root of the JSON on which to start mapping. For example, given the following JSON,

        {
            "user": {
                "settings": {
                    "basic": {...},
                    "advanced": {
                        "security": {
                            "javascript_enabled": true,
                            "allow_trackers": false
                        }
                    }
                }
            }
        }

the processing can be anchored on `user.settings.advanced.security` to translate the security settings. The following specification,

        {
            'javascript': ['javascript_enabled'],
            'trackers': ['allow_trackers']
        }

applied to the JSON above using an `on` parameter value of `user.settings.advanced.security`, will result in,

        {
            "javascript": true,
            "trackers": false
        }

Without the anchor, it's necessary to always include `user.settings.advanced.security` in the field specification, so the `javascript` mapping would look like `'javascript': ['user.settings.advanced.security.javascript_enabled']`.

#### The `$on` Specification

Another way of specifying the anchoring field is by directly adding it to the specification using the `$on` keyword. Unlike field specifications, the `$on` keyword takes a plain string and *not* a list/vector. For example, the previous sample specification can be alternatively expressed as,

        {
            '$on': 'user.settings.advanced.security',
            "javascript": ['javascript_enabled'],
            "trackers": ['allow_trackers']
        } 

Using this specification, the mapping can be invoked without the `on` parameter. Keywords in specifications are case-sensitive, so `$On`, `$ON`, etc. are *not* recognised.

#### Chaining `on` and `$on`

The `on` parameter and the `$on` keyword do **not** override, but instead are chained together. The existence of both during a mapping call results in the `$on` field chain being concatenated to the value provided in through the `on` parameter. For example, the following invocation is equivalent to the previous two above:

        json_converter(json, {
            '$on': 'advanced.security',
            "javascript": true,
            "trackers": false
        }, 'user.settings')

The `user.settings` field supplied through `on` parameter will be treated as a prefix to the `advanced.security` field specified through the `$on` keyword.

### Nested Specification

Aside from field specifications, nested dictionary-like specification can be provided to any recognised fields in the root specification. Nesting is useful for expressing nesting on single objects, or for applying conversion to a list of JSON objects defined in an array.

#### Single Object Nesting

For single objects, nested specs can be defined to look like the resulting JSON object. Nesting specification this way is a more expressive alternative to [field chaining that was demonstrated above](#field-chaining). For example, the following JSON, similar to the previous sections,

        {
            "person_name": "Jane Eyre",
            "person_age": 30
        }

can be mapped using nested specification defined with a nested `person` object:

        {
            'person': {
                'name': ['person_name'],
                'age': ['person_age']
            }
        }

[Anchoring](#anchoring) in nested specifications is also supported. However, unlike anchors in the main specification that can be expressed through the `on` parameter, nested anchors can only be specified using the `$on` keyword. It is also important to note that nested anchors are defined relative to the parent specification. For example, the following JSON,

        {
            "product_info" {
                "manufacturing": {
                    "location": "Cambridge, UK", 
                    "manufacturing_date": "2020-03-05",
                    "best_by_date": "2020-09-05"
                }
            }
        }

can be mapped using the following nested specification,

        {
            '$on': 'product_info',
            'production': {
                '$on': 'manufacturing',
                'date': ['manufacturing_date']
            }
        }

This mapping will result in the following JSON:

        {
            "production": {
                "date": "2020-03-05"
            }
        }

### Applying Specification to JSON Arrays

`JSON Converter` can distinguish between JSON object nodes and JSON array, and applies specification accordingly. When it determines that a field referred to by the specification is a collection of JSON objects, it applies the rules to each one of them iteratively. Note, however, that, as earlier mentioned in this document, using field chaining to refer to nested JSON array is *not* supported. To apply specifications to JSON arrays, they need to be explicitly [anchored](#anchoring) if they are nested within the original JSON document.

To illustrate, the following JSON object,

        {
            "books": [
                {
                    "title": "A Python Book",
                    "price": 23.75
                },
                {
                    "title": "A Novel",
                    "price": 7.99
                },
                {
                    "title": "Compilation of Fun Stuff",
                    "price": 10.10
                }
            ]
        }

can be translated using the following specification (assume `translate` and `convert` are defined; see [post-processing](#post-processing-using-custom-functions) for more information on this),

        {
            '$on': 'books',
            'titulo': ['title', translate, 'es'],
            'precio': ['price', convert, 'eur']
        }

Notice that, since the specification is anchored to the `books` node, only the list of field specifications are defined. Specifications applied to multiple objects this way are expressed as if it applies to a single object. This sample translation will return an array of JSON objects and *not* a JSON object containing an array. If a nested array is desired, the specification above can be nested instead:

        {
            'libros': {
                '$on': 'books',
                'titulo': ['title', translate, 'es'],
                'precio': ['price', convert, 'eur']
            }
        }

#### Filtering

When working on collections of data, it is sometimes required to only process some based on some criteria. This is done by specifying a custom filter function in the specification.

        '$filter': [<original_field>, <function>]

It will pass the value of the `original_field` as the parameter.

For example, to process only books whose prices are above 10.00 from the sample books JSON above, the following spec can be used:

        {
            'expensive_books': {
                '$on': 'books',
                '$filter': ['price', (value) => value > 10],
                'book_title': ['title'],
                'book_price': ['price']
            }
        }

While filtering can be applied to single JSON nodes, the application can be limited. Any JSON object filtered out, will appear as an empty JSON object in the resulting document.

#### Convert array elements to object properties

Array elements may be converted into object properties if they have a unique property which can be used as key for the object property.

        '$arrayToObject': [<key_field>, <value_field>]

To illustrate, the following JSON object

        {
            "months": [
                {
                    "name": "Januar",
                    "index": 1
                },
                {
                    "name": "Februar",
                    "index": 2
                },
                {
                    "name": "March",
                    "index": 3
                }
            ]
        }

using the following specification

        {
            '$on': 'months',
            'name': ['name'],
            'index': ['index'],
            '$arrayToObject': ['name', 'index']
        }

will result in

        {
            Januar: 1,
            Februar: 2,
            March: 3
        }

### JSON Literals

There are situations when the resulting JSON need to contain fields and values outside the scope of the source JSON document. In such cases, it's possible to define a post-processor that plugs-in a pre-defined dictionary-like or list structure. However, support for including literals in the specification is also provided.

#### Using Keywords

As mentioned above, there are 2 types of node that can be used for adding predefined values into the specification, which are object, and array. To specify a JSON object literal as field value in the resulting JSON document, the `$object` keyword is used with a dictionary-like structure:

        <field_name>: ['$object', <object_value>]

For example:

        'metadata': ['$object', {
            'date_created': '2020-03-13',
            'author': 'Jane Doe'
        }]

For collections or list of JSON objects, the `'$array'` is used instead:

        <field_name>: ['$array': <list>]

For example:

        'authors': ['$array', [
            {
                'name': 'Peter Z',
                'institution': 'Some University'
            },
            {
                'name': 'Mary Q',
                'institution': 'Some Research Institute'
            }
        ]]
