Objective #1: Simple RBAC Management

    Path Focus: src\app\(admin)\admin\access-control\roles

    1). In this process, this where I setup my roles and permissions.

    2). The files are copied from the term folder but since we're focus on the RBAC, make this file
        related to roles management.

    3). In the rename the add-term-modal to add-roles-modal. These modal will contain for adding a roles with the fields of:

        - Role Name
        - Description
        - Status (dropdown)
        - System Role (check box) this is for my future implementation for is_system column in the database

    4). Create a new file for view-roles-modal.tsx for viewing the roles.