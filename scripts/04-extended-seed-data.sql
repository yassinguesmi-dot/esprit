-- Seed data for extended Academic Activity Platform
-- Initial data for formations, modules, and reference data

-- Insert sample formations
INSERT INTO formations (name, code, level, duration_years) VALUES
('Licence en Informatique', 'LIC-INFO', 'Licence', 3),
('Master en Génie Logiciel', 'MST-GL', 'Master', 2),
('Master en Data Science', 'MST-DS', 'Master', 2),
('MBA Executive', 'MBA-EXEC', 'Executive', 2),
('Doctorat en Informatique', 'DOC-INFO', 'Doctorat', 3),
('Licence en Management', 'LIC-MGT', 'Licence', 3),
('Master en Marketing Digital', 'MST-MKTD', 'Master', 2)
ON CONFLICT (code) DO NOTHING;

-- Insert sample classes for current academic year
INSERT INTO classes (formation_id, name, code, level, academic_year, student_count)
SELECT 
  f.id,
  f.name || ' - Niveau ' || l.level,
  f.code || '-' || l.level,
  l.level,
  '2025-2026',
  30 + (l.level * 5)
FROM formations f
CROSS JOIN (SELECT 1 as level UNION SELECT 2 UNION SELECT 3) l
WHERE f.level = 'Licence'
ON CONFLICT DO NOTHING;

INSERT INTO classes (formation_id, name, code, level, academic_year, student_count)
SELECT 
  f.id,
  f.name || ' - Année ' || l.level,
  f.code || '-Y' || l.level,
  l.level,
  '2025-2026',
  25 + (l.level * 3)
FROM formations f
CROSS JOIN (SELECT 1 as level UNION SELECT 2) l
WHERE f.level = 'Master'
ON CONFLICT DO NOTHING;

-- Insert sample modules for Licence Informatique
INSERT INTO modules (formation_id, code, name, credits, coefficient, semester, description)
SELECT 
  f.id,
  mods.code,
  mods.name,
  mods.credits,
  mods.coefficient,
  mods.semester,
  mods.description
FROM formations f
CROSS JOIN (
  VALUES 
    ('INFO101', 'Algorithmique et Structures de Données', 6, 2.0, 1, 'Introduction aux algorithmes fondamentaux'),
    ('INFO102', 'Programmation Orientée Objet', 6, 2.0, 1, 'Concepts de la POO en Java'),
    ('INFO103', 'Bases de Données', 6, 2.0, 1, 'Modélisation et SQL'),
    ('INFO104', 'Mathématiques pour l''Informatique', 5, 1.5, 1, 'Algèbre et logique'),
    ('INFO105', 'Anglais Technique', 3, 1.0, 1, 'Communication professionnelle en anglais'),
    ('INFO201', 'Développement Web', 6, 2.0, 2, 'HTML, CSS, JavaScript et frameworks modernes'),
    ('INFO202', 'Systèmes d''Exploitation', 6, 2.0, 2, 'Concepts et administration des OS'),
    ('INFO203', 'Réseaux Informatiques', 6, 2.0, 2, 'Architecture et protocoles réseaux'),
    ('INFO204', 'Génie Logiciel', 5, 1.5, 2, 'Méthodologies de développement'),
    ('INFO205', 'Projet Intégré', 4, 1.5, 2, 'Projet de synthèse')
) AS mods(code, name, credits, coefficient, semester, description)
WHERE f.code = 'LIC-INFO'
ON CONFLICT (code) DO NOTHING;

-- Insert sample modules for Master Génie Logiciel
INSERT INTO modules (formation_id, code, name, credits, coefficient, semester, description)
SELECT 
  f.id,
  mods.code,
  mods.name,
  mods.credits,
  mods.coefficient,
  mods.semester,
  mods.description
FROM formations f
CROSS JOIN (
  VALUES 
    ('GL301', 'Architecture Logicielle Avancée', 6, 2.0, 1, 'Patterns et architecture distribuée'),
    ('GL302', 'DevOps et CI/CD', 6, 2.0, 1, 'Automatisation et déploiement continu'),
    ('GL303', 'Cloud Computing', 6, 2.0, 1, 'Services cloud et architecture scalable'),
    ('GL304', 'Sécurité Applicative', 5, 1.5, 1, 'Sécurité dans le cycle de développement'),
    ('GL305', 'Méthodologies Agiles', 4, 1.5, 1, 'Scrum, Kanban et pratiques agiles'),
    ('GL401', 'Microservices et APIs', 6, 2.0, 2, 'Architecture microservices'),
    ('GL402', 'Machine Learning Engineering', 6, 2.0, 2, 'Déploiement de modèles ML'),
    ('GL403', 'Projet de Fin d''Études', 8, 3.0, 2, 'Projet de recherche appliquée')
) AS mods(code, name, credits, coefficient, semester, description)
WHERE f.code = 'MST-GL'
ON CONFLICT (code) DO NOTHING;

-- Insert sample students
INSERT INTO students (student_number, first_name, last_name, email, formation_id, academic_year, status)
SELECT 
  'STU' || LPAD(generate_series::TEXT, 6, '0'),
  'Étudiant',
  'Test ' || generate_series,
  'student' || generate_series || '@esprit.tn',
  f.id,
  '2025-2026',
  'active'
FROM generate_series(1, 50) AS generate_series
CROSS JOIN (SELECT id FROM formations WHERE code = 'LIC-INFO' LIMIT 1) f
ON CONFLICT (student_number) DO NOTHING;

INSERT INTO students (student_number, first_name, last_name, email, formation_id, academic_year, status)
SELECT 
  'MSTU' || LPAD(generate_series::TEXT, 6, '0'),
  'Master',
  'Student ' || generate_series,
  'mstudent' || generate_series || '@esprit.tn',
  f.id,
  '2025-2026',
  'active'
FROM generate_series(1, 30) AS generate_series
CROSS JOIN (SELECT id FROM formations WHERE code = 'MST-GL' LIMIT 1) f
ON CONFLICT (student_number) DO NOTHING;

-- Insert sample prime rules
INSERT INTO prime_rules (name, description, activity_type_id, minimum_hours, maximum_hours, base_amount, hourly_rate, multiplier, academic_year, is_active)
SELECT 
  'Prime Enseignement ' || at.name,
  'Calcul de prime basé sur les heures d''enseignement',
  at.id,
  0,
  300,
  0,
  50.00,
  1.0,
  '2025-2026',
  true
FROM activity_types at
WHERE at.name = 'teaching'
ON CONFLICT DO NOTHING;

INSERT INTO prime_rules (name, description, activity_type_id, minimum_hours, maximum_hours, base_amount, hourly_rate, multiplier, academic_year, is_active)
SELECT 
  'Prime Encadrement PFE',
  'Prime pour encadrement de projets de fin d''études',
  at.id,
  1,
  20,
  500.00,
  200.00,
  1.2,
  '2025-2026',
  true
FROM activity_types at
WHERE at.name = 'supervision'
ON CONFLICT DO NOTHING;

INSERT INTO prime_rules (name, description, activity_type_id, minimum_hours, maximum_hours, base_amount, hourly_rate, multiplier, academic_year, is_active)
SELECT 
  'Prime Recherche Scientifique',
  'Prime pour publications scientifiques',
  at.id,
  1,
  50,
  1000.00,
  500.00,
  1.5,
  '2025-2026',
  true
FROM activity_types at
WHERE at.name = 'research'
ON CONFLICT DO NOTHING;

INSERT INTO prime_rules (name, description, activity_type_id, minimum_hours, maximum_hours, base_amount, hourly_rate, multiplier, academic_year, is_active)
SELECT 
  'Prime Responsabilité Académique',
  'Prime pour responsabilités administratives',
  at.id,
  1,
  12,
  300.00,
  150.00,
  0.9,
  '2025-2026',
  true
FROM activity_types at
WHERE at.name = 'academic_responsibility'
ON CONFLICT DO NOTHING;

-- Insert notification types for reference
INSERT INTO notifications (user_id, type, title, message, is_read)
SELECT 
  u.id,
  'welcome',
  'Bienvenue sur la plateforme',
  'Bienvenue sur la plateforme de suivi des activités académiques. Commencez par déclarer vos activités.',
  false
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.type = 'welcome'
)
LIMIT 5;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_teaching_activities_status ON teaching_activities(status);
CREATE INDEX IF NOT EXISTS idx_teaching_activities_semester ON teaching_activities(semester);
CREATE INDEX IF NOT EXISTS idx_supervision_activities_type ON supervision_activities(supervision_type);
CREATE INDEX IF NOT EXISTS idx_supervision_activities_status ON supervision_activities(status);
CREATE INDEX IF NOT EXISTS idx_research_publications_indexation ON research_publications(indexation);
CREATE INDEX IF NOT EXISTS idx_exam_supervisions_semester ON exam_supervisions(semester);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_teaching_user_year ON teaching_activities(user_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_supervision_user_year ON supervision_activities(user_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_exam_user_year ON exam_supervisions(user_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_research_user_date ON research_publications(user_id, publication_date);

-- Update statistics
ANALYZE formations;
ANALYZE classes;
ANALYZE modules;
ANALYZE students;
ANALYZE teaching_activities;
ANALYZE supervision_activities;
ANALYZE research_publications;
ANALYZE exam_supervisions;
ANALYZE academic_responsibilities;
