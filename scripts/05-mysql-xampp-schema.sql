-- MySQL/XAMPP schema (minimum production-ready core)
-- Import in phpMyAdmin after creating database `esprit_activities`

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS departments (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS roles (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role_id CHAR(36) NOT NULL,
  department_id CHAR(36) NULL,
  is_active TINYINT(1) DEFAULT 1,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_roles FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_users_departments FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS teaching_activities (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  formation_id CHAR(36) NULL,
  class_id CHAR(36) NULL,
  module_id CHAR(36) NULL,
  semester INT NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  teaching_type VARCHAR(50) NOT NULL,
  teaching_language VARCHAR(50),
  planned_hours INT NOT NULL,
  actual_hours INT DEFAULT 0,
  course_type VARCHAR(50),
  syllabus_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'draft',
  validated_by CHAR(36),
  validation_date TIMESTAMP NULL,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_teaching_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS supervision_activities (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  student_id CHAR(36) NULL,
  supervision_type VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'in_progress',
  status_validation VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_supervision_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS research_publications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  publication_type VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  authors TEXT NOT NULL,
  publication_date DATE,
  indexation VARCHAR(100),
  quartile VARCHAR(10),
  status VARCHAR(50) DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_research_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exam_supervisions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  exam_type VARCHAR(50) NOT NULL,
  exam_date DATE NOT NULL,
  session VARCHAR(50),
  semester INT,
  academic_year VARCHAR(10) NOT NULL,
  hours INT NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_exam_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS academic_responsibilities (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  responsibility_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  hours_allocated INT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_resp_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  message TEXT,
  related_entity_type VARCHAR(100),
  related_entity_id CHAR(36),
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS primes (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  total_amount DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'draft',
  calculation_details JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_primes_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS performance_indicators (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  teaching_hours INT DEFAULT 0,
  supervision_hours INT DEFAULT 0,
  research_count INT DEFAULT 0,
  conference_count INT DEFAULT 0,
  responsibilities_count INT DEFAULT 0,
  total_score DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_perf_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reports (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  report_type VARCHAR(50) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  summary JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_comments (
  id CHAR(36) PRIMARY KEY,
  activity_type VARCHAR(100) NOT NULL,
  activity_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  comment TEXT,
  comment_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS workflow_states (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  sequence_order INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS validations (
  id CHAR(36) PRIMARY KEY,
  activity_id CHAR(36) NOT NULL,
  validator_id CHAR(36) NOT NULL,
  workflow_state_id CHAR(36),
  comments TEXT,
  decision VARCHAR(50) NOT NULL,
  validation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_validations_validator FOREIGN KEY (validator_id) REFERENCES users(id),
  CONSTRAINT fk_validations_state FOREIGN KEY (workflow_state_id) REFERENCES workflow_states(id)
) ENGINE=InnoDB;

-- base roles
INSERT IGNORE INTO roles (id, name, description) VALUES
(UUID(), 'enseignant', 'Teaching staff member'),
(UUID(), 'chef_departement', 'Department chief'),
(UUID(), 'admin', 'System administrator'),
(UUID(), 'super_admin', 'Super administrator');

INSERT IGNORE INTO workflow_states (id, name, sequence_order, description) VALUES
(UUID(), 'draft', 1, 'Initial draft state'),
(UUID(), 'submitted', 2, 'Submitted for validation'),
(UUID(), 'validated', 3, 'Validated by supervisor'),
(UUID(), 'approved', 4, 'Approved by administration'),
(UUID(), 'rejected', 5, 'Rejected and needs revision');

SET FOREIGN_KEY_CHECKS = 1;
