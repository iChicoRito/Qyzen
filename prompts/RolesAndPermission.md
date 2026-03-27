Objective #1: Roles Creation

    1). In the database, create a new table name "roles" with these columns

        - id                        (PK)
        - name
        - description
        - is_system
        - is_active

        The sql should be store in the path sql where you can locate the other sql files such as these:

        - sql\AcademicYearTerm-update.sql
        - sql\AcademicYearTerm.sql

        This makes the query more organized.

    2). In the adding of the roles, the force naming convention to the role names is "snake_case" or "lowercase" e.g admin, instructor, super_admin.

    3). Before you proceed to the execution, give a summary of the process, what codes will be modified or added and delete (risky) and wait for the "Go!" command.

Objective #2: Applying Permissions to the Roles

    1). In the database, create a new table name "permissions" with these columns

        - id                        (PK)
        - name
        - resource
        - action
        - description
        - permission_string         (the permission string is just an combination of the resource and action e.g quiz:create, quiz:view and etc)

    2). In the current Add Permissions in the add-permissions-modal.tsx, remove the field "Select Role".

    3). The action and module field must be text field so i can manually type. 

    4). The final fields should be on that modal are:

        - Permission Name
        - Description
        - resource | action <- same row
        - Module | Status <- same row

    5). I also wanted to add a readonly field that automatically shows the permission_string in realtime like what I type.

    6). Before you proceed to the execution, give a summary of the process, what codes will be modified or added and delete (risky) and wait for the "Go!" command.

Objective #3: Junction table or pivot table for Roles and Permission

    1). In the database, create a new table name "role_permissions" with these columns

        - id                        (PK)
        - role_id                   (FK -> roles.id)
        - permission_id             (FK -> permissions.id)

Instructions and Objective in JSON format for better readability:

{
  "objectives": [
    {
      "objective_number": 1,
      "objective_title": "Roles Creation",
      "database_task": {
        "schema": "public",
        "action": "create_table",
        "table_name": "roles",
        "columns": [
          {
            "column_name": "id",
            "constraint": "PRIMARY KEY"
          },
          {
            "column_name": "name"
          },
          {
            "column_name": "description"
          },
          {
            "column_name": "is_system"
          },
          {
            "column_name": "is_active"
          }
        ],
        "sql_file_storage": {
          "instruction": "The SQL script must be stored in the sql directory where other SQL files are located",
          "known_existing_sql_files": [
            "sql/AcademicYearTerm-update.sql",
            "sql/AcademicYearTerm.sql"
          ],
          "purpose": "To keep SQL queries organized alongside existing SQL files"
        }
      },
      "validation_rules": [
        {
          "field": "name",
          "rule": "forced_naming_convention",
          "allowed_formats": [
            "snake_case",
            "lowercase"
          ],
          "examples": [
            "admin",
            "instructor",
            "super_admin"
          ]
        }
      ],
      "pre_execution_requirement": {
        "required": true,
        "action": "give_summary",
        "summary_must_include": [
          "Overview of the process to be performed",
          "List of codes or scripts that will be added",
          "List of codes or scripts that will be modified",
          "List of codes or scripts that will be deleted, flagged as risky"
        ],
        "await_confirmation": {
          "required": true,
          "confirmation_command": "Go!",
          "instruction": "Do not proceed to execution until the 'Go!' command is received"
        }
      }
    },
    {
      "objective_number": 2,
      "objective_title": "Applying Permissions to the Roles",
      "database_task": {
        "schema": "public",
        "action": "create_table",
        "table_name": "permissions",
        "columns": [
          {
            "column_name": "id",
            "constraint": "PRIMARY KEY"
          },
          {
            "column_name": "name"
          },
          {
            "column_name": "resource"
          },
          {
            "column_name": "action"
          },
          {
            "column_name": "description"
          },
          {
            "column_name": "permission_string",
            "description": "Auto-combination of resource and action fields",
            "format": "{resource}:{action}",
            "examples": [
              "quiz:create",
              "quiz:view"
            ]
          }
        ]
      },
      "ui_task": {
        "target_file": "add-permissions-modal.tsx",
        "changes": [
          {
            "change_type": "remove",
            "target_field": "Select Role",
            "instruction": "Remove the 'Select Role' field from the Add Permissions modal"
          },
          {
            "change_type": "modify",
            "target_fields": [
              "action",
              "module"
            ],
            "instruction": "Change action and module fields to text input fields so the user can manually type values"
          },
          {
            "change_type": "define_final_layout",
            "instruction": "The final fields displayed in the modal must be exactly as follows",
            "final_fields": [
              {
                "row": 1,
                "fields": [
                  "Permission Name"
                ]
              },
              {
                "row": 2,
                "fields": [
                  "Description"
                ]
              },
              {
                "row": 3,
                "layout": "same_row",
                "fields": [
                  "resource",
                  "action"
                ]
              },
              {
                "row": 4,
                "layout": "same_row",
                "fields": [
                  "Module",
                  "Status"
                ]
              }
            ]
          },
          {
            "change_type": "add",
            "target_field": "permission_string",
            "field_type": "readonly",
            "behavior": "realtime",
            "instruction": "Add a readonly field that automatically displays the permission_string as the user types, updating in realtime based on resource and action inputs"
          }
        ]
      },
      "pre_execution_requirement": {
        "required": true,
        "action": "give_summary",
        "summary_must_include": [
          "Overview of the process to be performed",
          "List of codes or scripts that will be added",
          "List of codes or scripts that will be modified",
          "List of codes or scripts that will be deleted, flagged as risky"
        ],
        "await_confirmation": {
          "required": true,
          "confirmation_command": "Go!",
          "instruction": "Do not proceed to execution until the 'Go!' command is received"
        }
      }
    },
    {
      "objective_number": 3,
      "objective_title": "Junction Table for Roles and Permissions",
      "database_task": {
        "schema": "public",
        "action": "create_table",
        "table_name": "role_permissions",
        "table_purpose": "Junction or pivot table linking roles and permissions",
        "columns": [
          {
            "column_name": "id",
            "constraint": "PRIMARY KEY"
          },
          {
            "column_name": "role_id",
            "foreign_key": {
              "references_table": "roles",
              "references_column": "id"
            }
          },
          {
            "column_name": "permission_id",
            "foreign_key": {
              "references_table": "permissions",
              "references_column": "id"
            }
          }
        ]
      }
    }
  ]
}