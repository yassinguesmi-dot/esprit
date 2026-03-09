-- Seed departments
INSERT INTO departments (name, code, description) VALUES
('Informatique', 'CS', 'Computer Science Department'),
('Mathématiques', 'MATH', 'Mathematics Department'),
('Physique', 'PHYS', 'Physics Department'),
('Langues', 'LANG', 'Languages Department'),
('Gestion', 'MGMT', 'Business Management Department')
ON CONFLICT (code) DO NOTHING;

-- Get role IDs and seed users
DO $$
DECLARE
  dept_info_id uuid;
  dept_math_id uuid;
  admin_id uuid;
  chef_id uuid;
  enseignant_role_id uuid;
  chef_role_id uuid;
  admin_role_id uuid;
  super_admin_role_id uuid;
BEGIN
  SELECT id INTO dept_info_id FROM departments WHERE code = 'CS' LIMIT 1;
  SELECT id INTO dept_math_id FROM departments WHERE code = 'MATH' LIMIT 1;
  
  SELECT id INTO enseignant_role_id FROM roles WHERE name = 'enseignant' LIMIT 1;
  SELECT id INTO chef_role_id FROM roles WHERE name = 'chef_departement' LIMIT 1;
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin' LIMIT 1;
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin' LIMIT 1;
  
  -- Seed super admin user
  INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_active, grade) 
  VALUES (
    'admin@esrit.tn',
    crypt('admin123', gen_salt('bf')),
    'Admin',
    'ESRIT',
    super_admin_role_id,
    true,
    'Administrateur'
  ) ON CONFLICT (email) DO NOTHING;

  SELECT id INTO admin_id FROM users WHERE email = 'admin@esrit.tn' LIMIT 1;

  -- Seed department chief
  INSERT INTO users (email, password_hash, first_name, last_name, role_id, department_id, is_active, grade)
  VALUES (
    'chief@esrit.tn',
    crypt('chief123', gen_salt('bf')),
    'Ali',
    'Bensalem',
    chef_role_id,
    dept_info_id,
    true,
    'Professeur'
  ) ON CONFLICT (email) DO NOTHING;

  SELECT id INTO chef_id FROM users WHERE email = 'chief@esrit.tn' LIMIT 1;

  -- Seed test enseignants
  INSERT INTO users (email, password_hash, first_name, last_name, role_id, department_id, is_active, grade)
  VALUES 
  ('prof1@esrit.tn', crypt('prof123', gen_salt('bf')), 'Mohamed', 'Ben Ali', enseignant_role_id, dept_info_id, true, 'Maître de Conférences'),
  ('prof2@esrit.tn', crypt('prof123', gen_salt('bf')), 'Fatima', 'Khadija', enseignant_role_id, dept_info_id, true, 'Maître Assistant'),
  ('prof3@esrit.tn', crypt('prof123', gen_salt('bf')), 'Ahmed', 'Hassan', enseignant_role_id, dept_math_id, true, 'Maître de Conférences'),
  ('prof4@esrit.tn', crypt('prof123', gen_salt('bf')), 'Leila', 'Mansouri', enseignant_role_id, dept_math_id, true, 'Maître Assistant')
  ON CONFLICT (email) DO NOTHING;

  -- Seed sample activities
  INSERT INTO activities (user_id, activity_type_id, title, description, start_date, end_date, hours_declared, hours_validated, status, created_at)
  SELECT 
    u.id,
    (SELECT id FROM activity_types WHERE name = 'teaching' LIMIT 1),
    'Programmation Web - L2 Info',
    'Cours de programmation web avec React et Node.js',
    (NOW() - INTERVAL '30 days')::DATE,
    (NOW() - INTERVAL '1 day')::DATE,
    30,
    30,
    'approved',
    NOW() - INTERVAL '30 days'
  FROM users u 
  WHERE u.email = 'prof1@esrit.tn'
  ON CONFLICT DO NOTHING;

  INSERT INTO activities (user_id, activity_type_id, title, description, start_date, end_date, hours_declared, hours_validated, status, created_at)
  SELECT 
    u.id,
    (SELECT id FROM activity_types WHERE name = 'research' LIMIT 1),
    'Recherche en Intelligence Artificielle',
    'Projet de recherche en machine learning',
    (NOW() - INTERVAL '60 days')::DATE,
    (NOW() - INTERVAL '10 days')::DATE,
    120,
    120,
    'approved',
    NOW() - INTERVAL '60 days'
  FROM users u 
  WHERE u.email = 'prof1@esrit.tn'
  ON CONFLICT DO NOTHING;

  INSERT INTO activities (user_id, activity_type_id, title, description, start_date, end_date, hours_declared, hours_validated, status, created_at)
  SELECT 
    u.id,
    (SELECT id FROM activity_types WHERE name = 'supervision' LIMIT 1),
    'Encadrement de projet fin d''étude',
    'Supervision de 3 étudiants en projet de fin d''étude',
    (NOW() - INTERVAL '45 days')::DATE,
    NOW()::DATE,
    60,
    60,
    'approved',
    NOW() - INTERVAL '45 days'
  FROM users u 
  WHERE u.email = 'prof2@esrit.tn'
  ON CONFLICT DO NOTHING;

  INSERT INTO activities (user_id, activity_type_id, title, description, start_date, end_date, hours_declared, status, created_at)
  SELECT 
    u.id,
    (SELECT id FROM activity_types WHERE name = 'teaching' LIMIT 1),
    'Cours Mathématiques Discrètes',
    'Cours de 2ème année licence informatique',
    (NOW() - INTERVAL '20 days')::DATE,
    NOW()::DATE,
    24,
    'submitted',
    NOW() - INTERVAL '20 days'
  FROM users u 
  WHERE u.email = 'prof3@esrit.tn'
  ON CONFLICT DO NOTHING;

  -- Add validations for activities (using workflow_state)
  INSERT INTO validations (activity_id, validator_id, workflow_state_id, comments, decision, validation_date)
  SELECT 
    a.id,
    chef_id,
    (SELECT id FROM workflow_states WHERE name = 'approved' LIMIT 1),
    'Activité validée par le chef de département',
    'approved',
    NOW()
  FROM activities a
  WHERE a.user_id IN (
    SELECT id FROM users WHERE email IN ('prof1@esrit.tn', 'prof2@esrit.tn')
  )
  ON CONFLICT DO NOTHING;

END $$;

-- Confirm seeding completed
SELECT 'Data seeding completed successfully' as status;
