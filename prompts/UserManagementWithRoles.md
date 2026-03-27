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

    2). Now in the adding of the users, it has 2 user_type for now, the student and educator/instructor (let's just use the term educator). Every user has own format of their user ID format, for student 1234-12345 and for educator 1234-1234.

    3). Now here in the adding of the users, add field for checkbox for selecting the role that is connected to the tables roles along with the permissions.

    4). To make a junction table for users and roles, make a new table name "user_roles_permissions"  with these columns

        tbl_user_roles
        - id                        (PK)
        - user_id                   (FK -> users.id)
        - role_id                   (FK -> roles.id)
        add a timestamps here and other ***_at columns.

    5). For the table creation, no RLS for now, just disabled it upon creation.

    6). Before you proceed to the execution, give a summary of the process, what codes will be modified or added and delete (risky) and wait for the "Go!" command.

