Objective #1: User Creation along with Roles and Permissions.

    1). In the database, create a new table name "users" with these columns

        - id
        - user_type (admin, student and educator)
        - user_id (this column is not for referrencing, it is like user_number)
        - given_name
        - surname
        - email
        - (no password for now)
        - is_active

    2). Now in the adding of the users, it has 2 user_type for now, the student and educator/instructor (let's just use the term educator). Every user has own format of their user ID format, for student 1234-12345 and for educator 1234-1234. If the user is created as student, the user_type would be student, and educator for educator.

    3). Now here in the adding of the users, add field for checkbox for selecting the role that is connected to the tables roles along with the permissions.

    4). To make a junction table for users and roles, make a new table name "user_roles_permissions"  with these columns

        tbl_user_roles
        - id                        (PK)
        - user_id                   (FK -> users.id)
        - role_id                   (FK -> roles.id)
        add a timestamps here and other ***_at columns.

    5). For the table creation, no RLS for now, just disabled it upon creation.

    6). Before you proceed to the execution, give a summary of the process, what codes will be modified or added and delete (risky) and wait for the "Go!" command.

Instructions and Objective in JSON format for better readability:

{
  "objectives": [
    {
      "objective_number": 1,
      "objective_title": "User Creation along with Roles and Permissions",
      "tasks": [
        {
          "task_number": 1,
          "task_title": "Create Users Table",
          "database_task": {
            "schema": "public",
            "action": "create_table",
            "table_name": "users",
            "columns": [
              {
                "column_name": "id"
              },
              {
                "column_name": "user_type",
                "allowed_values": [
                  "admin",
                  "student",
                  "educator"
                ]
              },
              {
                "column_name": "user_id",
                "description": "Not a foreign key reference. This is a user-facing identifier number, like a user_number"
              },
              {
                "column_name": "given_name"
              },
              {
                "column_name": "surname"
              },
              {
                "column_name": "email"
              },
              {
                "column_name": "password",
                "status": "excluded",
                "reason": "No password implementation for now"
              },
              {
                "column_name": "is_active"
              }
            ],
            "row_level_security": {
              "enabled": false,
              "reason": "Roles and auth related features are not yet available"
            }
          }
        },
        {
          "task_number": 2,
          "task_title": "User Creation Form — User Types and ID Format Rules",
          "ui_task": {
            "supported_user_types_on_creation": [
              "student",
              "educator"
            ],
            "note": "The term 'educator' is used instead of 'instructor'",
            "user_id_format_rules": [
              {
                "user_type": "student",
                "id_format": "1234-12345",
                "description": "4 digits, dash, 5 digits"
              },
              {
                "user_type": "educator",
                "id_format": "1234-1234",
                "description": "4 digits, dash, 4 digits"
              }
            ],
            "user_type_assignment_rules": [
              {
                "condition": "User is created as student",
                "result": "user_type is set to 'student'"
              },
              {
                "condition": "User is created as educator",
                "result": "user_type is set to 'educator'"
              }
            ]
          }
        },
        {
          "task_number": 3,
          "task_title": "Role Selection in User Creation Form",
          "ui_task": {
            "target": "add user form",
            "change_type": "add",
            "field": {
              "field_type": "checkbox",
              "label": "Select Role",
              "description": "A checkbox field for selecting the role(s) to assign to the user",
              "data_source": {
                "connected_table": "roles",
                "related_tables": [
                  "permissions"
                ],
                "description": "The checkbox options are populated from the roles table, which is connected to permissions"
              }
            }
          }
        },
        {
          "task_number": 4,
          "task_title": "Create Junction Table for Users and Roles",
          "database_task": {
            "schema": "public",
            "action": "create_table",
            "table_name": "tbl_user_roles",
            "table_purpose": "Junction table linking users and roles",
            "columns": [
              {
                "column_name": "id",
                "constraint": "PRIMARY KEY"
              },
              {
                "column_name": "user_id",
                "foreign_key": {
                  "references_table": "users",
                  "references_column": "id"
                }
              },
              {
                "column_name": "role_id",
                "foreign_key": {
                  "references_table": "roles",
                  "references_column": "id"
                }
              },
              {
                "column_name": "timestamps",
                "description": "Include timestamp columns and other ***_at columns"
              }
            ],
            "row_level_security": {
              "enabled": false,
              "reason": "No RLS upon creation, to be disabled immediately after table is created"
            }
          }
        },
        {
          "task_number": 5,
          "task_title": "RLS Policy for All Tables in This Objective",
          "instruction": "For all tables created under this objective, Row Level Security must be disabled upon creation"
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
    }
  ]
}