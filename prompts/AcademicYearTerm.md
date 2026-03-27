Objective #1: Creation of Academic Year

    1). In the database schema:public, create a new table name "academic_year" with these columns

        - id
        - is_active

    2). Since we don't have yet roles and auth related, just disabled the RLS for now.

    3). Before you proceed to the execution, give a summary of the process, what codes will be modified or added and delete (risky) and wait for the "Go!" command.

Objective #2: Creation of the Academic Term

    1). In the adding of the academic term, create a table again name "academic_term" with these columns

        - id
        - term_name
        - semester
        - academic_year_id (FK -> academic_year.id)
        - is_active.

    2). Make sure that the term name cannot be duplicated in the same semester and academic year.

    3). Since we don't have yet roles and auth related, just disabled the RLS for now.

    4). Before you proceed to the execution, give a summary of the process, what codes will be modified or added and delete (risky) and wait for the "Go!" command.


Instructions and Objective in JSON format for better readability:

{
  "objectives": [
    {
      "objective_number": 1,
      "objective_title": "Creation of Academic Year",
      "database_task": {
        "schema": "public",
        "action": "create_table",
        "table_name": "academic_year",
        "columns": [
          {
            "column_name": "id"
          },
          {
            "column_name": "is_active"
          }
        ],
        "row_level_security": {
          "enabled": false,
          "reason": "Roles and auth related features are not yet available"
        }
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
      "objective_number": 2,
      "objective_title": "Creation of Academic Term",
      "database_task": {
        "schema": "public",
        "action": "create_table",
        "table_name": "academic_term",
        "columns": [
          {
            "column_name": "id"
          },
          {
            "column_name": "term_name"
          },
          {
            "column_name": "semester"
          },
          {
            "column_name": "academic_year_id",
            "foreign_key": {
              "references_table": "academic_year",
              "references_column": "id"
            }
          },
          {
            "column_name": "is_active"
          }
        ],
        "constraints": [
          {
            "constraint_type": "unique",
            "description": "The term_name cannot be duplicated within the same semester and academic_year_id",
            "columns_involved": [
              "term_name",
              "semester",
              "academic_year_id"
            ]
          }
        ],
        "row_level_security": {
          "enabled": false,
          "reason": "Roles and auth related features are not yet available"
        }
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
    }
  ]
}