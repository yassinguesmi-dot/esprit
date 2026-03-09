-- Extended Schema for Detailed Academic Activities
-- Based on project specifications

-- Formations Table
CREATE TABLE IF NOT EXISTS formations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  level VARCHAR(100), -- Licence, Master, Doctorat, Executive
  department_id UUID REFERENCES departments(id),
  duration_years INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes Table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formation_id UUID REFERENCES formations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  level INT, -- 1, 2, 3...
  academic_year VARCHAR(10),
  student_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_classes_formation_id ON classes(formation_id);
CREATE INDEX idx_classes_academic_year ON classes(academic_year);

-- Modules (Courses) Table
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formation_id UUID REFERENCES formations(id),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  credits INT,
  coefficient DECIMAL(4, 2),
  semester INT, -- 1 or 2
  description TEXT,
  prerequisites TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_modules_formation_id ON modules(formation_id);

-- Teaching Activities Table (Detailed)
CREATE TABLE IF NOT EXISTS teaching_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  formation_id UUID REFERENCES formations(id),
  class_id UUID REFERENCES classes(id),
  module_id UUID REFERENCES modules(id),
  semester INT NOT NULL, -- 1 or 2
  academic_year VARCHAR(10) NOT NULL,
  teaching_type VARCHAR(50) NOT NULL, -- présentiel, en ligne, alternance, exécutif
  teaching_language VARCHAR(50), -- Français, Anglais, Arabe
  planned_hours INT NOT NULL,
  actual_hours INT DEFAULT 0,
  course_type VARCHAR(50), -- CM, TD, TP
  syllabus_url VARCHAR(500),
  syllabus_file BYTEA,
  status VARCHAR(50) DEFAULT 'draft',
  validated_by UUID REFERENCES users(id),
  validation_date TIMESTAMP,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teaching_activities_user_id ON teaching_activities(user_id);
CREATE INDEX idx_teaching_activities_academic_year ON teaching_activities(academic_year);
CREATE INDEX idx_teaching_activities_module_id ON teaching_activities(module_id);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_number VARCHAR(50) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  formation_id UUID REFERENCES formations(id),
  class_id UUID REFERENCES classes(id),
  academic_year VARCHAR(10),
  status VARCHAR(50) DEFAULT 'active', -- active, graduated, suspended
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_student_number ON students(student_number);
CREATE INDEX idx_students_formation_id ON students(formation_id);

-- Supervision Activities Table (PFE, Mémoire, Stage, Thèse)
CREATE TABLE IF NOT EXISTS supervision_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id),
  supervision_type VARCHAR(50) NOT NULL, -- PFE, Memoire, Stage, These
  title VARCHAR(500) NOT NULL,
  description TEXT,
  formation_id UUID REFERENCES formations(id),
  academic_year VARCHAR(10) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  defense_date DATE,
  role VARCHAR(50) NOT NULL, -- Encadrant, Rapporteur, President
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, defended, canceled
  grade DECIMAL(4, 2),
  remarks TEXT,
  documents JSONB DEFAULT '[]',
  co_supervisor_id UUID REFERENCES users(id),
  status_validation VARCHAR(50) DEFAULT 'pending',
  validated_by UUID REFERENCES users(id),
  validation_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_supervision_activities_user_id ON supervision_activities(user_id);
CREATE INDEX idx_supervision_activities_student_id ON supervision_activities(student_id);
CREATE INDEX idx_supervision_activities_academic_year ON supervision_activities(academic_year);

-- Jury Participations Table
CREATE TABLE IF NOT EXISTS jury_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervision_id UUID REFERENCES supervision_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(50) NOT NULL, -- President, Rapporteur, Examinateur
  defense_date DATE NOT NULL,
  hours INT DEFAULT 2,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jury_participations_user_id ON jury_participations(user_id);
CREATE INDEX idx_jury_participations_supervision_id ON jury_participations(supervision_id);

-- Research Publications Table
CREATE TABLE IF NOT EXISTS research_publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  publication_type VARCHAR(50) NOT NULL, -- Article, Conference, Book_Chapter, Book
  title VARCHAR(500) NOT NULL,
  authors TEXT NOT NULL,
  publication_date DATE,
  journal_name VARCHAR(255),
  conference_name VARCHAR(255),
  publisher VARCHAR(255),
  volume VARCHAR(50),
  issue VARCHAR(50),
  pages VARCHAR(50),
  doi VARCHAR(255),
  isbn VARCHAR(50),
  indexation VARCHAR(100), -- Scopus, Web of Science, PubMed, etc.
  quartile VARCHAR(10), -- Q1, Q2, Q3, Q4
  impact_factor DECIMAL(5, 3),
  url VARCHAR(500),
  abstract TEXT,
  keywords TEXT,
  status VARCHAR(50) DEFAULT 'published', -- published, accepted, submitted
  attachment_url VARCHAR(500),
  validated_by UUID REFERENCES users(id),
  validation_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_research_publications_user_id ON research_publications(user_id);
CREATE INDEX idx_research_publications_publication_type ON research_publications(publication_type);
CREATE INDEX idx_research_publications_publication_date ON research_publications(publication_date);

-- Research Projects Table
CREATE TABLE IF NOT EXISTS research_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  acronym VARCHAR(100),
  description TEXT,
  project_type VARCHAR(100), -- National, International, Industrial Partnership
  funding_source VARCHAR(255),
  budget DECIMAL(15, 2),
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'ongoing', -- ongoing, completed, suspended
  coordinator_id UUID REFERENCES users(id),
  website_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_research_projects_coordinator_id ON research_projects(coordinator_id);

-- Research Project Members Table
CREATE TABLE IF NOT EXISTS research_project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(100), -- Coordinator, Member, PhD Student
  contribution_percentage DECIMAL(5, 2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_research_project_members_project_id ON research_project_members(project_id);
CREATE INDEX idx_research_project_members_user_id ON research_project_members(user_id);

-- Scientific Events (Organization) Table
CREATE TABLE IF NOT EXISTS scientific_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL, -- Seminar, Conference, Workshop, Scientific_Day
  title VARCHAR(500) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  end_date DATE,
  location VARCHAR(255),
  organizer_id UUID REFERENCES users(id),
  scope VARCHAR(50), -- Local, National, International
  participants_count INT,
  website_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'planned', -- planned, completed, canceled
  validated_by UUID REFERENCES users(id),
  validation_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scientific_events_organizer_id ON scientific_events(organizer_id);
CREATE INDEX idx_scientific_events_event_date ON scientific_events(event_date);

-- Event Organizers Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS event_organizers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES scientific_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(100), -- Main Organizer, Co-organizer, Committee Member
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_organizers_event_id ON event_organizers(event_id);
CREATE INDEX idx_event_organizers_user_id ON event_organizers(user_id);

-- Exam Supervision Table
CREATE TABLE IF NOT EXISTS exam_supervisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id),
  exam_type VARCHAR(50) NOT NULL, -- DS, Exam Final, Rattrapage
  exam_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  session VARCHAR(50), -- Principale, Controle, Rattrapage
  semester INT,
  academic_year VARCHAR(10) NOT NULL,
  class_id UUID REFERENCES classes(id),
  room VARCHAR(100),
  students_count INT,
  hours INT NOT NULL,
  comments TEXT,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, canceled
  validated_by UUID REFERENCES users(id),
  validation_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exam_supervisions_user_id ON exam_supervisions(user_id);
CREATE INDEX idx_exam_supervisions_exam_date ON exam_supervisions(exam_date);
CREATE INDEX idx_exam_supervisions_academic_year ON exam_supervisions(academic_year);

-- Academic Responsibilities Table
CREATE TABLE IF NOT EXISTS academic_responsibilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  responsibility_type VARCHAR(100) NOT NULL, -- Maitre_Stage, Coordinateur_Module, Responsable_Filiere, Chef_Departement, Directeur_Programme
  title VARCHAR(255) NOT NULL,
  description TEXT,
  department_id UUID REFERENCES departments(id),
  formation_id UUID REFERENCES formations(id),
  module_id UUID REFERENCES modules(id),
  start_date DATE NOT NULL,
  end_date DATE,
  hours_allocated INT, -- Nombre d'heures équivalentes
  status VARCHAR(50) DEFAULT 'active', -- active, completed
  validated_by UUID REFERENCES users(id),
  validation_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_academic_responsibilities_user_id ON academic_responsibilities(user_id);
CREATE INDEX idx_academic_responsibilities_responsibility_type ON academic_responsibilities(responsibility_type);
CREATE INDEX idx_academic_responsibilities_department_id ON academic_responsibilities(department_id);

-- Activity Comments/History Table
CREATE TABLE IF NOT EXISTS activity_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type VARCHAR(100) NOT NULL, -- teaching, supervision, research, etc.
  activity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  comment_type VARCHAR(50), -- validation, revision, note
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_comments_activity ON activity_comments(activity_type, activity_id);
CREATE INDEX idx_activity_comments_user_id ON activity_comments(user_id);

-- Comprehensive Activity View (materialized)
CREATE MATERIALIZED VIEW IF NOT EXISTS comprehensive_activities AS
SELECT 
  ta.id,
  'teaching' as activity_type,
  ta.user_id,
  m.name as title,
  ta.academic_year,
  ta.semester,
  ta.planned_hours as planned_value,
  ta.actual_hours as actual_value,
  ta.status,
  ta.created_at
FROM teaching_activities ta
LEFT JOIN modules m ON ta.module_id = m.id

UNION ALL

SELECT 
  sa.id,
  'supervision' as activity_type,
  sa.user_id,
  sa.title,
  sa.academic_year,
  NULL as semester,
  1 as planned_value,
  CASE WHEN sa.status = 'defended' THEN 1 ELSE 0 END as actual_value,
  sa.status_validation as status,
  sa.created_at
FROM supervision_activities sa

UNION ALL

SELECT 
  rp.id,
  'research' as activity_type,
  rp.user_id,
  rp.title,
  EXTRACT(YEAR FROM rp.publication_date)::VARCHAR as academic_year,
  NULL as semester,
  1 as planned_value,
  1 as actual_value,
  'published' as status,
  rp.created_at
FROM research_publications rp

UNION ALL

SELECT 
  es.id,
  'exam_supervision' as activity_type,
  es.user_id,
  'Exam Supervision' as title,
  es.academic_year,
  es.semester,
  es.hours as planned_value,
  es.hours as actual_value,
  es.status,
  es.created_at
FROM exam_supervisions es

UNION ALL

SELECT 
  ar.id,
  'responsibility' as activity_type,
  ar.user_id,
  ar.title,
  EXTRACT(YEAR FROM ar.start_date)::VARCHAR as academic_year,
  NULL as semester,
  ar.hours_allocated as planned_value,
  ar.hours_allocated as actual_value,
  ar.status,
  ar.created_at
FROM academic_responsibilities ar;

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_comprehensive_activities()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW comprehensive_activities;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns on new tables
CREATE TRIGGER update_formations_updated_at BEFORE UPDATE ON formations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teaching_activities_updated_at BEFORE UPDATE ON teaching_activities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supervision_activities_updated_at BEFORE UPDATE ON supervision_activities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_publications_updated_at BEFORE UPDATE ON research_publications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_projects_updated_at BEFORE UPDATE ON research_projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scientific_events_updated_at BEFORE UPDATE ON scientific_events
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_supervisions_updated_at BEFORE UPDATE ON exam_supervisions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academic_responsibilities_updated_at BEFORE UPDATE ON academic_responsibilities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
