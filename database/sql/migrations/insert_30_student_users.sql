-- ==================== INSERT 30 STUDENT USERS ====================
-- File: database/sql/migrations/insert_30_student_users.sql
-- Created: 2026-03-29
-- Purpose: Insert 30 sample student users into tbl_users and assign the student role.

WITH inserted_students AS (
  INSERT INTO public.tbl_users (
    user_type,
    user_id,
    given_name,
    surname,
    email,
    is_active
  )
  VALUES
    ('student', '2020-50001', 'Ariana', 'Mendoza', 'ariana.mendoza.2020-50001@example.com', true),
    ('student', '2020-50002', 'Bryle', 'Navarro', 'bryle.navarro.2020-50002@example.com', true),
    ('student', '2020-50003', 'Camille', 'Ramos', 'camille.ramos.2020-50003@example.com', true),
    ('student', '2020-50004', 'Darren', 'Lopez', 'darren.lopez.2020-50004@example.com', true),
    ('student', '2020-50005', 'Elaine', 'Castro', 'elaine.castro.2020-50005@example.com', true),
    ('student', '2020-50006', 'Franco', 'Reyes', 'franco.reyes.2020-50006@example.com', true),
    ('student', '2020-50007', 'Gia', 'Torres', 'gia.torres.2020-50007@example.com', true),
    ('student', '2020-50008', 'Harvey', 'Santos', 'harvey.santos.2020-50008@example.com', true),
    ('student', '2020-50009', 'Ivy', 'Flores', 'ivy.flores.2020-50009@example.com', true),
    ('student', '2020-50010', 'Jared', 'Aquino', 'jared.aquino.2020-50010@example.com', true),
    ('student', '2020-50011', 'Kiara', 'Garcia', 'kiara.garcia.2020-50011@example.com', true),
    ('student', '2020-50012', 'Lance', 'Villanueva', 'lance.villanueva.2020-50012@example.com', true),
    ('student', '2020-50013', 'Mika', 'Fernandez', 'mika.fernandez.2020-50013@example.com', true),
    ('student', '2020-50014', 'Noel', 'Diaz', 'noel.diaz.2020-50014@example.com', true),
    ('student', '2020-50015', 'Olivia', 'Morales', 'olivia.morales.2020-50015@example.com', true),
    ('student', '2020-50016', 'Paolo', 'Gonzales', 'paolo.gonzales.2020-50016@example.com', true),
    ('student', '2020-50017', 'Queenie', 'Herrera', 'queenie.herrera.2020-50017@example.com', true),
    ('student', '2020-50018', 'Ralph', 'Cruz', 'ralph.cruz.2020-50018@example.com', true),
    ('student', '2020-50019', 'Sofia', 'Bautista', 'sofia.bautista.2020-50019@example.com', true),
    ('student', '2020-50020', 'Tristan', 'De Leon', 'tristan.deleon.2020-50020@example.com', true),
    ('student', '2020-50021', 'Ulysses', 'Domingo', 'ulysses.domingo.2020-50021@example.com', true),
    ('student', '2020-50022', 'Vina', 'Salazar', 'vina.salazar.2020-50022@example.com', true),
    ('student', '2020-50023', 'Warren', 'Pascual', 'warren.pascual.2020-50023@example.com', true),
    ('student', '2020-50024', 'Xyra', 'Lim', 'xyra.lim.2020-50024@example.com', true),
    ('student', '2020-50025', 'Yvette', 'Mercado', 'yvette.mercado.2020-50025@example.com', true),
    ('student', '2020-50026', 'Zion', 'Velasco', 'zion.velasco.2020-50026@example.com', true),
    ('student', '2020-50027', 'Amiel', 'Padilla', 'amiel.padilla.2020-50027@example.com', true),
    ('student', '2020-50028', 'Bianca', 'Rosales', 'bianca.rosales.2020-50028@example.com', true),
    ('student', '2020-50029', 'Cedric', 'Manalang', 'cedric.manalang.2020-50029@example.com', true),
    ('student', '2020-50030', 'Danica', 'Valdez', 'danica.valdez.2020-50030@example.com', true)
  RETURNING id
)
INSERT INTO public.tbl_user_roles (user_id, role_id)
SELECT inserted_students.id, tbl_roles.id
FROM inserted_students
CROSS JOIN public.tbl_roles
WHERE tbl_roles.name = 'student';
