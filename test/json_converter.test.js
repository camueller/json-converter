const {json_converter} = require('@camueller/json-converter');

describe('json_converter', () => {
    describe('object node', () => {
        describe('no post-processor', () => {
            test('no source hierarchy and no destination hierarchy', () => {
                expect(json_converter(JSON.stringify({
                    "person_name": "Juan dela Cruz",
                    "person_age": 37
                }), {
                    'name': ['person_name'],
                    'age': ['person_age']
                })).toStrictEqual({
                    "name": "Juan dela Cruz",
                    "age": 37
                });
            });

            test('no source hierarchy and destination hierarchy', () => {
                expect(json_converter(JSON.stringify({
                    "person_name": "Juan dela Cruz",
                    "person_age": 37
                }), {
                    'person.name': ['person_name'],
                    'person.age': ['person_age']
                })).toStrictEqual({
                    "person": {
                        "name": "Juan dela Cruz",
                        "age": 37
                    }
                });
            });

            test('source hierarchy and no destination hierarchy', () => {
                expect(json_converter(JSON.stringify({
                    employee: {
                        "name": "Juan dela Cruz",
                        "age": 37
                    }
                }), {
                    'name': ['employee.name'],
                    'age': ['employee.age']
                })).toStrictEqual({
                    "name": "Juan dela Cruz",
                    "age": 37
                });
            });

            test('source hierarchy and destination hierarchy', () => {
                expect(json_converter(JSON.stringify({
                    employee: {
                        "name": "Juan dela Cruz",
                        "age": 37
                    }
                }), {
                    'person.name': ['$.employee.name'],
                    'person.age': ['$.employee.age']
                })).toStrictEqual({
                    "person": {
                        "name": "Juan dela Cruz",
                        "age": 37
                    }
                });
            });
        });

        describe('with post-processor', () => {
            test('no source hierarchy, no destination hierarchy, post-processor', () => {
                expect(json_converter(JSON.stringify({
                    "person_name": "Juan dela Cruz",
                    "person_age": 37
                }), {
                    'name': ['person_name'],
                    'age': ['person_age'],
                    'adult': ['person_age', (value) => value > 18]
                })).toStrictEqual({
                    "name": "Juan dela Cruz",
                    "age": 37,
                    "adult": true
                });
            });

            test('source hierarchy, no destination hierarchy, post-processor', () => {
                expect(json_converter(JSON.stringify({
                    employee: {
                        "name": "Juan dela Cruz",
                        "age": 37
                    }
                }), {
                    'name': ['employee.name'],
                    'age': ['employee.age'],
                    'adult': ['employee.age', (value) => value > 18]
                })).toStrictEqual({
                    "name": "Juan dela Cruz",
                    "age": 37,
                    "adult": true
                });
            });
        });
    });

    describe('Anchoring', () => {
        test('using "on" parameter', () => {
            expect(json_converter(JSON.stringify({
                    "user": {
                        "settings": {
                            "basic": {
                                "level": "one"
                            },
                            "advanced": {
                                "security": {
                                    "javascript_enabled": true,
                                    "allow_trackers": false
                                }
                            }
                        }
                    }
                }),
                {
                    'javascript': ['javascript_enabled'],
                    'trackers': ['allow_trackers']
                },
                'user.settings.advanced.security'
            )).toStrictEqual({
                "javascript": true,
                "trackers": false
            });
        });

        test('using "$on" specification', () => {
            expect(json_converter(JSON.stringify({
                    "user": {
                        "settings": {
                            "basic": {
                                "level": "one"
                            },
                            "advanced": {
                                "security": {
                                    "javascript_enabled": true,
                                    "allow_trackers": false
                                }
                            }
                        }
                    }
                }),
                {
                    '$on': '$.user.settings.advanced.security',
                    'javascript': ['javascript_enabled'],
                    'trackers': ['allow_trackers']
                })).toStrictEqual({
                "javascript": true,
                "trackers": false
            });
        });

        test('chaining "on" parameter and "$on" specification', () => {
            expect(json_converter(JSON.stringify({
                    "user": {
                        "settings": {
                            "basic": {
                                "level": "one"
                            },
                            "advanced": {
                                "security": {
                                    "javascript_enabled": true,
                                    "allow_trackers": false
                                }
                            }
                        }
                    }
                }),
                {
                    '$on': 'advanced.security',
                    'javascript': ['javascript_enabled'],
                    'trackers': ['allow_trackers']
                },
                'user.settings'
            )).toStrictEqual({
                "javascript": true,
                "trackers": false
            });
        });
    });

    describe('Single Object Nesting', () => {
        test('one level', () => {
            expect(json_converter(JSON.stringify({
                "person_name": "Juan dela Cruz",
                "person_age": 37
            }), {
                'person': {
                    'name': ['person_name'],
                    'age': ['person_age']
                }
            })).toStrictEqual({
                person: {
                    "name": "Juan dela Cruz",
                    "age": 37
                }
            });
        });

        test('two levels', () => {
            expect(json_converter(JSON.stringify({
                "person_name": "Juan dela Cruz",
                "person_age": 37
            }), {
                'person': {
                    employee: {
                        'name': ['person_name'],
                        'age': ['person_age']
                    }
                }
            })).toStrictEqual({
                person: {
                    employee: {
                        "name": "Juan dela Cruz",
                        "age": 37
                    }
                }
            });
        });

        test('with Anchoring', () => {
            expect(json_converter(JSON.stringify({
                "product_info": {
                    "manufacturing": {
                        "location": "Cambridge, UK",
                        "manufacturing_date": "2020-03-05",
                        "best_by_date": "2020-09-05"
                    }
                }
            }), {
                '$on': 'product_info',
                'production': {
                    '$on': 'manufacturing',
                    'date': ['manufacturing_date']
                }
            })).toStrictEqual({
                "production": {
                    "date": "2020-03-05"
                }
            });
        });
    });

    describe('Arrays', () => {
        test('no destination hierarchy', () => {
            expect(json_converter(JSON.stringify({
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
            }), {
                '$on': 'books',
                'titulo': ['title'],
                'precio': ['price']
            })).toStrictEqual([
                {
                    "titulo": "A Python Book",
                    "precio": 23.75
                },
                {
                    "titulo": "A Novel",
                    "precio": 7.99
                },
                {
                    "titulo": "Compilation of Fun Stuff",
                    "precio": 10.10
                }
            ]);
        });

        test('with destination hierarchy', () => {
            expect(json_converter(JSON.stringify({
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
            }), {
                'libros': {
                    '$on': 'books',
                    'titulo': ['title'],
                    'precio': ['price']
                }
            })).toStrictEqual({libros: [
                    {
                        "titulo": "A Python Book",
                        "precio": 23.75
                    },
                    {
                        "titulo": "A Novel",
                        "precio": 7.99
                    },
                    {
                        "titulo": "Compilation of Fun Stuff",
                        "precio": 10.10
                    }
                ]});
        });

        test('with filtering', () => {
            expect(json_converter(JSON.stringify({
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
            }), {
                'expensive_books': {
                    '$on': 'books',
                    '$filter': ['price', (value) => value > 10],
                    'book_title': ['title'],
                    'book_price': ['price']
                }
            })).toStrictEqual({expensive_books: [
                    {
                        "book_title": "A Python Book",
                        "book_price": 23.75
                    },
                    {
                        "book_title": "Compilation of Fun Stuff",
                        "book_price": 10.10
                    },
                ]});
        });

        test('convert array elements to object properties', () => {
            expect(json_converter(JSON.stringify({
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
            }), {
                '$on': 'months',
                'name': ['name'],
                'index': ['index'],
                '$arrayToObject': ['name', 'index']
            })).toStrictEqual({
                Januar: 1,
                Februar: 2,
                March: 3
            });
        });
    });

    describe('JSON Literals', () => {
        test('using keyword "$object"', () => {
            expect(json_converter(JSON.stringify({
                "person_name": "Juan dela Cruz",
                "person_age": 37
            }), {
                'name': ['person_name'],
                'age': ['person_age'],
                'metadata': ['$object', {
                    'date_created': '2020-03-13',
                    'author': 'Jane Doe'
                }]
            })).toStrictEqual({
                "name": "Juan dela Cruz",
                "age": 37,
                "metadata": {
                    "date_created": "2020-03-13",
                    "author": "Jane Doe"
                }
            });
        });

        test('using keyword "$array"', () => {
            expect(json_converter(JSON.stringify({
                "person_name": "Juan dela Cruz",
                "person_age": 37
            }), {
                'name': ['person_name'],
                'age': ['person_age'],
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
            })).toStrictEqual({
                "name": "Juan dela Cruz",
                "age": 37,
                "authors": [
                    {
                        "name": "Peter Z",
                        "institution": "Some University"
                    },
                    {
                        "name": "Mary Q",
                        "institution": "Some Research Institute"
                    }
                ]
            });
        });
    });
});
