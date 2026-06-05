-- Migration: 002_seed.up.sql
-- Seeds the database with the initial data that mirrors data.json.
-- Uses INSERT ... ON CONFLICT DO NOTHING so it is safe to run multiple times.

-- ─── Faculties ────────────────────────────────────────────────────────────────
INSERT INTO faculties (id, name, code, dean) VALUES
    ('f1', 'Sciences Informatiques',           'INFO', 'Pr. Daniel Maombi'),
    ('f2', 'Sciences Commerciales et Gestion', 'SCG',  'Pr. Sarah Nzigire'),
    ('f3', 'Génie Électrique',                 'ELEC', 'Pr. Patrick Mugisho')
ON CONFLICT (id) DO NOTHING;

-- ─── Rooms ────────────────────────────────────────────────────────────────────
INSERT INTO rooms (id, name, capacity, description, category) VALUES
    ('r1', 'Salle A1',  40, 'Salle de cours principale',        'Salle de cours'),
    ('r2', 'Salle B2',  35, 'Salle de cours faculté INFO',      'Salle de cours'),
    ('r3', 'Salle C3',  45, 'Salle L1',                         'Salle de cours'),
    ('r4', 'Salle D1',  40, 'Salle SCG',                        'Salle de cours'),
    ('r5', 'Labo Info', 30, 'Laboratoire Informatique',          'Laboratoire'),
    ('r6', 'Labo Élec', 25, 'Laboratoire Génie Électrique',      'Laboratoire')
ON CONFLICT (id) DO NOTHING;

-- ─── Promotions ───────────────────────────────────────────────────────────────
INSERT INTO promotions (id, name, faculty_id, level) VALUES
    ('p1', 'L1 Informatique', 'f1', 'L1'),
    ('p2', 'L2 Informatique', 'f1', 'L2'),
    ('p3', 'L3 Informatique', 'f1', 'L3'),
    ('p4', 'L1 Gestion',      'f2', 'L1'),
    ('p5', 'L2 Gestion',      'f2', 'L2'),
    ('p6', 'L1 Électrique',   'f3', 'L1')
ON CONFLICT (id) DO NOTHING;

-- ─── Teachers ─────────────────────────────────────────────────────────────────
INSERT INTO teachers (id, matricule, first_name, last_name, middle_name, email, phone, faculty_id, title, status) VALUES
    ('t1', 'ENS-001', 'Jean-Paul', 'Bahati',  '', 'jp.bahati@ista-goma.cd',        '+243 990 111 111', 'f1', 'Professeur',      'active'),
    ('t2', 'ENS-002', 'Marie',     'Kavugho', '', 'marie.kavugho@ista-goma.cd',    '+243 990 222 222', 'f1', 'Assistante',      'active'),
    ('t3', 'ENS-003', 'Olivier',   'Ndungo',  '', 'olivier.ndungo@ista-goma.cd',   '+243 990 333 333', 'f2', 'Chef de Travaux', 'active'),
    ('t4', 'ENS-004', 'Rachel',    'Masika',  '', 'rachel.masika@ista-goma.cd',    '+243 990 444 444', 'f3', 'Professeur',      'active'),
    ('t5', 'ENS-005', 'Samuel',    'Paluku',  '', 'samuel.paluku@ista-goma.cd',    '+243 990 555 555', 'f1', 'Assistant',       'pending')
ON CONFLICT (id) DO NOTHING;

-- ─── Students ─────────────────────────────────────────────────────────────────
INSERT INTO students (id, matricule, first_name, last_name, middle_name, birth_date, email, phone, gender, promotion_id, faculty_id, status, enrollment_date, average) VALUES
    ('s1',  'ISTA-2023-001', 'Aline',    'Mukamana',  '', '2001-03-15', 'aline.mukamana@ista-goma.cd',   '+243 970 111 222', 'F', 'p3', 'f1', 'active',    '2021-10-04', 14.6),
    ('s2',  'ISTA-2023-002', 'Patient',  'Kasereka',  '', '2000-07-22', 'patient.kasereka@ista-goma.cd', '+243 971 222 333', 'M', 'p3', 'f1', 'active',    '2021-10-04', 12.9),
    ('s3',  'ISTA-2023-003', 'Chance',   'Wabiwa',    '', '2002-01-10', 'chance.wabiwa@ista-goma.cd',    '+243 972 333 444', 'F', 'p2', 'f1', 'active',    '2022-10-03', 13.4),
    ('s4',  'ISTA-2024-014', 'Josué',    'Mbeki',     '', '2003-05-18', 'josue.mbeki@ista-goma.cd',      '+243 973 444 555', 'M', 'p1', 'f1', 'pending',   '2024-09-30', 0),
    ('s5',  'ISTA-2024-015', 'Divine',   'Amani',     '', '2003-11-25', 'divine.amani@ista-goma.cd',     '+243 974 555 666', 'F', 'p1', 'f1', 'active',    '2024-09-28', 11.2),
    ('s6',  'ISTA-2023-051', 'Emmanuel', 'Lukoo',     '', '2001-09-03', 'emmanuel.lukoo@ista-goma.cd',   '+243 975 666 777', 'M', 'p5', 'f2', 'active',    '2022-10-03', 15.1),
    ('s7',  'ISTA-2023-052', 'Sarah',    'Kahindo',   '', '2001-04-14', 'sarah.kahindo@ista-goma.cd',    '+243 976 777 888', 'F', 'p5', 'f2', 'suspended', '2022-10-03', 9.8),
    ('s8',  'ISTA-2024-061', 'Benjamin', 'Tibasima',  '', '2003-08-30', 'benjamin.tibasima@ista-goma.cd','+243 977 888 999', 'M', 'p4', 'f2', 'pending',   '2024-09-29', 0),
    ('s9',  'ISTA-2023-071', 'Gloire',   'Sifa',      '', '2002-06-07', 'gloire.sifa@ista-goma.cd',      '+243 978 999 000', 'F', 'p6', 'f3', 'active',    '2023-10-02', 13.7),
    ('s10', 'ISTA-2023-072', 'Trésor',   'Munganga',  '', '2002-12-20', 'tresor.munganga@ista-goma.cd',  '+243 979 010 121', 'M', 'p6', 'f3', 'active',    '2023-10-02', 12.1),
    ('s11', 'ISTA-2024-082', 'Esther',   'Nabintu',   '', '2003-02-28', 'esther.nabintu@ista-goma.cd',   '+243 980 121 232', 'F', 'p1', 'f1', 'pending',   '2024-09-27', 0),
    ('s12', 'ISTA-2022-099', 'Moïse',    'Baraka',    '', '2000-10-11', 'moise.baraka@ista-goma.cd',     '+243 981 232 343', 'M', 'p3', 'f1', 'active',    '2021-10-04', 16.2)
ON CONFLICT (id) DO NOTHING;

-- ─── Courses ──────────────────────────────────────────────────────────────────
INSERT INTO courses (id, code, name, credits, faculty_id, promotion_id, teacher_id, hours) VALUES
    ('c1', 'INFO301', 'Programmation Web Avancée',     6, 'f1', 'p3', 't1', 60),
    ('c2', 'INFO302', 'Bases de Données',              5, 'f1', 'p3', 't1', 50),
    ('c3', 'INFO201', 'Algorithmique',                 6, 'f1', 'p2', 't2', 60),
    ('c4', 'SCG201',  'Comptabilité Générale',         5, 'f2', 'p5', 't3', 45),
    ('c5', 'SCG202',  'Marketing Stratégique',         4, 'f2', 'p5', 't3', 40),
    ('c6', 'ELEC101', 'Circuits Électriques',          6, 'f3', 'p6', 't4', 60),
    ('c7', 'INFO101', 'Introduction à l''Informatique',4, 'f1', 'p1', 't5', 40),
    ('c8', 'INFO102', 'Mathématiques Discrètes',       5, 'f1', 'p1', 't5', 50)
ON CONFLICT (id) DO NOTHING;

-- ─── Schedules ────────────────────────────────────────────────────────────────
INSERT INTO schedules (id, course_id, promotion_id, teacher_id, day, start_time, end_time, room) VALUES
    ('sch1',  'c1', 'p3', 't1', 'Lundi',    '08:00', '10:00', 'Salle A1'),
    ('sch2',  'c2', 'p3', 't1', 'Lundi',    '10:30', '12:30', 'Salle A1'),
    ('sch3',  'c1', 'p3', 't1', 'Mercredi', '08:00', '10:00', 'Labo Info'),
    ('sch4',  'c3', 'p2', 't2', 'Mardi',    '08:00', '10:00', 'Salle B2'),
    ('sch5',  'c7', 'p1', 't5', 'Lundi',    '13:00', '15:00', 'Salle C3'),
    ('sch6',  'c8', 'p1', 't5', 'Jeudi',    '08:00', '10:00', 'Salle C3'),
    ('sch7',  'c4', 'p5', 't3', 'Mardi',    '10:30', '12:30', 'Salle D1'),
    ('sch8',  'c5', 'p5', 't3', 'Vendredi', '08:00', '10:00', 'Salle D1'),
    ('sch9',  'c6', 'p6', 't4', 'Mercredi', '10:30', '12:30', 'Labo Élec'),
    ('sch10', 'c2', 'p3', 't1', 'Vendredi', '10:30', '12:30', 'Salle A1')
ON CONFLICT (id) DO NOTHING;

-- ─── Users ────────────────────────────────────────────────────────────────────
INSERT INTO users (id, first_name, last_name, email, role, faculty_id, ref_id, active) VALUES
    ('u1', 'Aline',     'Mukamana',   'aline.mukamana@ista-goma.cd',    'student',             'f1', 's1',  TRUE),
    ('u2', 'Jean-Paul', 'Bahati',     'jp.bahati@ista-goma.cd',         'teacher',             'f1', 't1',  TRUE),
    ('u3', 'Espoir',    'Kambale',    'espoir.kambale@ista-goma.cd',    'apparitorat',         NULL, NULL,  TRUE),
    ('u4', 'Grace',     'Furaha',     'grace.furaha@ista-goma.cd',      'secretariat_faculte', 'f1', NULL,  TRUE),
    ('u5', 'Innocent',  'Byamungu',   'innocent.byamungu@ista-goma.cd', 'secretariat_general', NULL, NULL,  TRUE),
    ('u6', 'Christine', 'Mwamini',    'christine.mwamini@ista-goma.cd', 'rectorat',            NULL, NULL,  TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── User credentials (dev seed password: Ista@2024!) ─────────────────────────
-- Hash generated with bcrypt cost 10 for "Ista@2024!"
INSERT INTO user_credentials (user_id, password_hash, activated_at) VALUES
    ('u1', '$2a$10$SE9zo7P/6netLVEXLMpNpOeshWET96VBHfB7CLYYNYx8nmA9DTGwK', NOW()),
    ('u2', '$2a$10$SE9zo7P/6netLVEXLMpNpOeshWET96VBHfB7CLYYNYx8nmA9DTGwK', NOW()),
    ('u3', '$2a$10$SE9zo7P/6netLVEXLMpNpOeshWET96VBHfB7CLYYNYx8nmA9DTGwK', NOW()),
    ('u4', '$2a$10$SE9zo7P/6netLVEXLMpNpOeshWET96VBHfB7CLYYNYx8nmA9DTGwK', NOW()),
    ('u5', '$2a$10$SE9zo7P/6netLVEXLMpNpOeshWET96VBHfB7CLYYNYx8nmA9DTGwK', NOW()),
    ('u6', '$2a$10$SE9zo7P/6netLVEXLMpNpOeshWET96VBHfB7CLYYNYx8nmA9DTGwK', NOW())
ON CONFLICT (user_id) DO NOTHING;

-- ─── Grades ───────────────────────────────────────────────────────────────────
INSERT INTO grades (id, student_id, course_id, promotion_id, score, status, session, type) VALUES
    ('g1',  's1',  'c1', 'p3', 15, 'validated', 'Janvier 2026', 'Examen'),
    ('g2',  's1',  'c2', 'p3', 14, 'validated', 'Janvier 2026', 'Examen'),
    ('g3',  's2',  'c1', 'p3', 12, 'pending',   'Janvier 2026', 'Examen'),
    ('g4',  's2',  'c2', 'p3', 13, 'pending',   'Janvier 2026', 'Examen'),
    ('g5',  's12', 'c1', 'p3', 17, 'validated', 'Janvier 2026', 'Examen'),
    ('g6',  's12', 'c2', 'p3', 16, 'pending',   'Janvier 2026', 'Examen'),
    ('g7',  's3',  'c3', 'p2', 13, 'validated', 'Janvier 2026', 'Examen'),
    ('g8',  's6',  'c4', 'p5', 15, 'validated', 'Janvier 2026', 'Examen'),
    ('g9',  's6',  'c5', 'p5', 14, 'pending',   'Janvier 2026', 'Examen'),
    ('g10', 's9',  'c6', 'p6', 13, 'validated', 'Janvier 2026', 'Examen')
ON CONFLICT (id) DO NOTHING;

-- ─── Announcements ────────────────────────────────────────────────────────────
INSERT INTO announcements (id, title, body, author, date, audience, priority, scope) VALUES
    ('a1', 'Ouverture de la session d''examens',
     'La session d''examens de Janvier débute le 15 janvier 2026.',
     'Secrétariat Général', '2026-01-05', 'all', 'important', 'global'),
    ('a2', 'Frais académiques — 2ème tranche',
     'La date limite pour le paiement de la deuxième tranche est fixée au 31 janvier 2026.',
     'Apparitorat', '2026-01-08', 'student', 'urgent', 'global'),
    ('a3', 'Réunion du corps enseignant',
     'Une réunion de coordination pédagogique est prévue le vendredi à 14h00.',
     'Rectorat', '2026-01-10', 'teacher', 'info', 'global'),
    ('a4', 'Mise à jour des fiches d''inscription',
     'Tous les étudiants en attente doivent finaliser leur dossier avant la fin du mois.',
     'Apparitorat', '2026-01-12', 'all', 'important', 'global'),
    ('a5', 'Disponibilité de la bibliothèque numérique',
     'L''accès à la bibliothèque numérique est désormais ouvert à tous les étudiants inscrits.',
     'Secrétariat Général', '2026-01-14', 'student', 'info', 'global')
ON CONFLICT (id) DO NOTHING;

-- ─── Assignments & Resources ──────────────────────────────────────────────────
INSERT INTO assignments (id, course_id, teacher_id, title, description, due_date, type) VALUES
    ('asgn-1', 'c1', 't1', 'TP1 — Application CRUD en Node.js',
     'Réalisez une application CRUD complète avec Node.js et Express.',
     '2026-02-15', 'PDF'),
    ('asgn-2', 'c2', 't1', 'Modélisation d''une base de données hospitalière',
     'Concevez le schéma entité-relation d''un système hospitalier.',
     '2026-02-10', 'PDF')
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_resources (id, course_id, teacher_id, title, type, url) VALUES
    ('res-1', 'c1', 't1', 'Cours 1 — Introduction à Node.js',     'pdf',   'https://drive.google.com/file/d/example1'),
    ('res-2', 'c1', 't1', 'Tutoriel React Hooks — Vidéo YouTube', 'video', 'https://www.youtube.com/watch?v=example'),
    ('res-3', 'c2', 't1', 'Exercices SQL avancés (corrigés)',      'pdf',   'https://drive.google.com/file/d/example2')
ON CONFLICT (id) DO NOTHING;
