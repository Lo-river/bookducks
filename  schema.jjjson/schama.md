book schema.json: 

{
  "kind": "collectionType",
  "collectionName": "books",
  "info": {
    "singularName": "book",
    "pluralName": "books",
    "displayName": "Book",
    "description": ""
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "title": {
      "type": "string"
    },
    "author": {
      "type": "string"
    },
    "pages": {
      "type": "integer",
      "required": false
    },
    "published": {
      "type": "date"
    },
    "cover": {
      "type": "media",
      "multiple": false,
      "required": false,
      "allowedTypes": [
        "images",
        "files"
      ]
    },
    "reading_list_items": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::reading-list-item.reading-list-item",
      "mappedBy": "book"
    },
    "users": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "plugin::users-permissions.user",
      "mappedBy": "savedBooks"
    }
  }
}


reading-list-item schema.json:

{
  "kind": "collectionType",
  "collectionName": "reading_list_items",
  "info": {
    "singularName": "reading-list-item",
    "pluralName": "reading-list-items",
    "displayName": "ReadingListItem",
    "description": ""
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "user": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user",
      "inversedBy": "reading_list_items"
    },
    "rating": {
      "type": "number",
      "min": 1,
      "max": 5
    },
    "book": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::book.book",
      "inversedBy": "reading_list_items"
    }
  }
}

user schema.json:
{
  "kind": "collectionType",
  "collectionName": "up_users",
  "info": {
    "name": "user",
    "singularName": "user",
    "pluralName": "users",
    "displayName": "User",
    "description": ""
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "username": {
      "type": "string",
      "minLength": 3,
      "unique": true,
      "configurable": false,
      "required": true
    },
    "email": {
      "type": "email",
      "minLength": 6,
      "configurable": false,
      "required": true
    },
    "provider": {
      "type": "string",
      "configurable": false
    },
    "password": {
      "type": "password",
      "minLength": 6,
      "configurable": false,
      "private": true,
      "searchable": false
    },
    "resetPasswordToken": {
      "type": "string",
      "configurable": false,
      "private": true,
      "searchable": false
    },
    "confirmationToken": {
      "type": "string",
      "configurable": false,
      "private": true,
      "searchable": false
    },
    "confirmed": {
      "type": "boolean",
      "default": false,
      "configurable": false
    },
    "blocked": {
      "type": "boolean",
      "default": false,
      "configurable": false
    },
    "role": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.role",
      "inversedBy": "users",
      "configurable": false
    },
    "savedBooks": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::book.book",
      "inversedBy": "users"
    },
    "reading_list_items": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::reading-list-item.reading-list-item",
      "mappedBy": "user"
    }
  }
}
