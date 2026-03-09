# 📡 Documentation API - ESPRIT Activities Platform

Documentation complète des endpoints API REST de la plateforme.

## Table des Matières

- [Authentification](#authentification)
- [Teaching Activities](#teaching-activities)
- [Supervision Activities](#supervision-activities)
- [Research Publications](#research-publications)
- [Exam Supervisions](#exam-supervisions)
- [Academic Responsibilities](#academic-responsibilities)
- [Workflow & Validation](#workflow--validation)
- [Calculations & Performance](#calculations--performance)
- [Reports Generation](#reports-generation)
- [Notifications](#notifications)
- [Analytics](#analytics)
- [Admin Routes](#admin-routes)
- [Codes d'erreur](#codes-derreur)

---

## 🔐 Authentification

### POST /api/auth/register

Inscription d'un nouvel utilisateur.

**Request:**
```json
{
  "name": "Nessrine Tlili",
  "email": "nessrine.tlili@esprit.tn",
  "password": "SecureP@ssw0rd",
  "department_id": 1,
  "role": "enseignant"
}
```

**Response (201):**
```json
{
  "id": 42,
  "name": "Nessrine Tlili",
  "email": "nessrine.tlili@esprit.tn",
  "role": "enseignant",
  "department_id": 1,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400` - Données invalides
- `409` - Email déjà utilisé

---

### POST /api/auth/login

Connexion utilisateur.

**Request:**
```json
{
  "email": "nessrine.tlili@esprit.tn",
  "password": "SecureP@ssw0rd"
}
```

**Response (200):**
```json
{
  "id": 42,
  "name": "Nessrine Tlili",
  "email": "nessrine.tlili@esprit.tn",
  "role": "enseignant",
  "department_id": 1,
  "department_name": "Département Informatique",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `401` - Identifiants invalides
- `404` - Utilisateur non trouvé

---

## 📚 Teaching Activities

### GET /api/teaching

Récupérer les activités d'enseignement.

**Query Parameters:**
- `academic_year` (optional): Ex: "2023-2024"
- `semester` (optional): 1 ou 2
- `status` (optional): draft, pending, validated, rejected

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "activities": [
    {
      "id": 1,
      "formation_name": "3ème année Licence Informatique",
      "class_name": "3LI1",
      "module_name": "Développement Web Avancé",
      "activity_type": "CM",
      "planned_hours": 42,
      "completed_hours": 40,
      "academic_year": "2023-2024",
      "semester": 1,
      "status": "validated",
      "created_at": "2023-09-15T10:30:00Z",
      "updated_at": "2023-12-10T14:20:00Z"
    }
  ],
  "total_hours": {
    "CM": 40,
    "TD": 28,
    "TP": 24,
    "total": 92
  }
}
```

---

### POST /api/teaching

Créer une nouvelle activité d'enseignement.

**Request:**
```json
{
  "formation_id": 3,
  "class_id": 5,
  "module_id": 12,
  "activity_type": "CM",
  "planned_hours": 42,
  "completed_hours": 40,
  "academic_year": "2023-2024",
  "semester": 1,
  "notes": "Cours magistral en amphithéâtre A"
}
```

**Response (201):**
```json
{
  "id": 15,
  "formation_id": 3,
  "class_id": 5,
  "module_id": 12,
  "activity_type": "CM",
  "planned_hours": 42,
  "completed_hours": 40,
  "academic_year": "2023-2024",
  "semester": 1,
  "status": "draft",
  "created_at": "2024-01-15T09:00:00Z"
}
```

**Errors:**
- `400` - Données invalides
- `401` - Non authentifié
- `404` - Formation/Module/Classe non trouvé

---

### PUT /api/teaching

Mettre à jour une activité d'enseignement.

**Request:**
```json
{
  "id": 15,
  "completed_hours": 42,
  "status": "pending",
  "notes": "Cours complété - programme terminé"
}
```

**Response (200):**
```json
{
  "id": 15,
  "completed_hours": 42,
  "status": "pending",
  "updated_at": "2024-01-20T16:30:00Z"
}
```

**Business Rules:**
- Seul le créateur peut modifier
- Statut "validated" ne peut pas être modifié
- Notification envoyée au chef de département quand status = "pending"

---

## 👨‍🎓 Supervision Activities

### GET /api/supervision

Récupérer les activités d'encadrement.

**Query Parameters:**
- `academic_year` (optional): Ex: "2023-2024"
- `type` (optional): PFE, Memoire, Stage, These
- `status` (optional): in_progress, defended, canceled

**Response (200):**
```json
{
  "supervisions": [
    {
      "id": 1,
      "student_name": "Marie Martin",
      "student_email": "marie.martin@esprit.tn",
      "formation_name": "3ème année Licence GL",
      "supervision_type": "PFE",
      "title": "Application mobile de gestion de bibliothèque",
      "role": "Encadrant",
      "start_date": "2023-09-01",
      "defense_date": "2024-06-15",
      "co_supervisor_name": null,
      "status": "defended",
      "grade": 16.5,
      "academic_year": "2023-2024"
    }
  ],
  "statistics": {
    "PFE": { "Encadrant": 8, "Rapporteur": 3, "President": 2 },
    "Memoire": { "Encadrant": 2 },
    "These": { "Directeur": 1 },
    "total": 16
  }
}
```

---

### POST /api/supervision

Créer une activité d'encadrement.

**Request:**
```json
{
  "student_id": 42,
  "formation_id": 3,
  "supervision_type": "PFE",
  "title": "Développement d'une application IoT",
  "role": "Encadrant",
  "start_date": "2023-09-01",
  "defense_date": "2024-06-20",
  "co_supervisor_id": 15,
  "academic_year": "2023-2024"
}
```

**Response (201):**
```json
{
  "id": 28,
  "student_id": 42,
  "supervision_type": "PFE",
  "title": "Développement d'une application IoT",
  "role": "Encadrant",
  "status": "in_progress",
  "created_at": "2023-09-01T10:00:00Z"
}
```

**Supervision Types:**
- `PFE` - Projet de Fin d'Études
- `Memoire` - Mémoire de Master
- `Stage` - Stage d'été
- `These` - Thèse de Doctorat

**Roles:**
- `Encadrant` / `Directeur` - Superviseur principal
- `Rapporteur` - Examinateur
- `President` - Président du jury
- `Co-encadrant` - Co-superviseur

---

### PUT /api/supervision

Mettre à jour une supervision.

**Request:**
```json
{
  "id": 28,
  "status": "defended",
  "defense_date": "2024-06-20",
  "grade": 17.5
}
```

---

### DELETE /api/supervision?id=28

Supprimer une supervision (soft delete).

**Response (200):**
```json
{
  "message": "Supervision activity deleted successfully"
}
```

---

## 📖 Research Publications

### GET /api/research

Récupérer les publications de recherche.

**Query Parameters:**
- `academic_year` (optional): Ex: "2023"
- `publication_type` (optional): Article, Conference, Book, Chapter

**Response (200):**
```json
{
  "publications": [
    {
      "id": 1,
      "publication_type": "Article",
      "title": "Deep Learning Applications in Educational Data Mining",
      "journal_conference": "International Journal of Educational Technology",
      "authors": "Dupont J., Martin P., Bernard L.",
      "indexation": "Scopus",
      "quartile": "Q1",
      "impact_factor": 4.25,
      "publication_date": "2023-06-15",
      "doi": "10.1234/ijet.2023.456",
      "status": "validated"
    }
  ],
  "statistics": {
    "total": 12,
    "by_type": {
      "Article": 8,
      "Conference": 3,
      "Book": 1
    },
    "by_indexation": {
      "Scopus": 6,
      "Web of Science": 4,
      "IEEE": 2
    },
    "by_quartile": {
      "Q1": 4,
      "Q2": 3,
      "Q3": 1
    }
  }
}
```

---

### POST /api/research

Ajouter une publication.

**Request:**
```json
{
  "publication_type": "Article",
  "title": "Blockchain Technology in Academic Credentialing",
  "journal_conference": "IEEE Access",
  "authors": "Dupont J., Smith A.",
  "indexation": "Scopus",
  "quartile": "Q1",
  "impact_factor": 3.9,
  "publication_date": "2024-01-10",
  "doi": "10.1109/ACCESS.2024.123456",
  "pdf_url": "https://ieeexplore.ieee.org/document/123456"
}
```

**Response (201):**
```json
{
  "id": 45,
  "publication_type": "Article",
  "title": "Blockchain Technology in Academic Credentialing",
  "status": "draft",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Publication Types:**
- `Article` - Article de journal
- `Conference` - Communication dans une conférence
- `Book` - Livre
- `Chapter` - Chapitre de livre

**Indexations:**
- `Scopus`
- `Web of Science`
- `IEEE`
- `ACM`
- `PubMed`
- `Other`

---

### PUT /api/research

Mettre à jour une publication.

**Request:**
```json
{
  "id": 45,
  "quartile": "Q2",
  "impact_factor": 3.75,
  "status": "pending"
}
```

---

### DELETE /api/research?id=45

Supprimer une publication.

---

## 📝 Exam Supervisions

### GET /api/exams

Récupérer les surveillances d'examens.

**Query Parameters:**
- `academic_year` (optional): Ex: "2023-2024"
- `semester` (optional): 1 ou 2
- `session` (optional): Principale, Controle, Rattrapage

**Response (200):**
```json
{
  "exams": [
    {
      "id": 1,
      "module_name": "Structures de Données",
      "class_name": "2LI1",
      "exam_date": "2024-01-15",
      "session": "Principale",
      "room": "A201",
      "student_count": 45,
      "hours": 3,
      "academic_year": "2023-2024",
      "semester": 1
    }
  ],
  "total_hours": {
    "semester_1": 24,
    "semester_2": 18,
    "total": 42
  }
}
```

---

### POST /api/exams

Créer une surveillance d'examen.

**Request:**
```json
{
  "module_id": 12,
  "class_id": 5,
  "exam_date": "2024-01-15",
  "session": "Principale",
  "room": "A201",
  "student_count": 45,
  "hours": 3,
  "academic_year": "2023-2024",
  "semester": 1
}
```

**Session Types:**
- `Principale` - Session principale
- `Controle` - Session de contrôle
- `Rattrapage` - Session de rattrapage

---

### PUT /api/exams

Mettre à jour une surveillance.

**Request:**
```json
{
  "id": 1,
  "room": "B105",
  "student_count": 42,
  "hours": 3
}
```

---

## 🏛️ Academic Responsibilities

### GET /api/responsibilities

Récupérer les responsabilités académiques.

**Query Parameters:**
- `academic_year` (optional): Ex: "2023-2024"
- `responsibility_type` (optional): Voir types ci-dessous

**Response (200):**
```json
{
  "responsibilities": [
    {
      "id": 1,
      "responsibility_type": "Coordinateur_Module",
      "module_name": "Développement Web",
      "hours_allocated": 40,
      "start_date": "2023-09-01",
      "end_date": "2024-06-30",
      "status": "active",
      "academic_year": "2023-2024"
    }
  ],
  "total_hours": 120
}
```

---

### POST /api/responsibilities

Créer une responsabilité.

**Request:**
```json
{
  "responsibility_type": "Responsable_Filiere",
  "formation_id": 3,
  "hours_allocated": 80,
  "start_date": "2023-09-01",
  "end_date": "2024-06-30",
  "description": "Responsable filière Génie Logiciel",
  "academic_year": "2023-2024"
}
```

**Responsibility Types:**
- `Maitre_Stage` - Maître de stage
- `Coordinateur_Module` - Coordinateur de module
- `Responsable_Filiere` - Responsable de filière
- `Chef_Departement` - Chef de département
- `Directeur_Programme` - Directeur de programme

---

### PUT /api/responsibilities

Mettre à jour une responsabilité.

**Request:**
```json
{
  "id": 1,
  "hours_allocated": 50,
  "status": "completed"
}
```

---

### DELETE /api/responsibilities?id=1

Supprimer une responsabilité.

---

## 🔄 Workflow & Validation

### POST /api/workflow

Gérer le workflow de validation.

#### Action: Submit (Soumettre pour validation)

**Request:**
```json
{
  "action": "submit",
  "activity_type": "teaching",
  "activity_id": 15
}
```

**Response (200):**
```json
{
  "message": "Activity submitted for validation",
  "new_status": "pending",
  "notification_sent": true
}
```

**Business Flow:**
- Status : `draft` → `pending`
- Notification envoyée au chef de département
- Enregistrement dans la table `validations`

---

#### Action: Validate (Valider)

**Request:**
```json
{
  "action": "validate",
  "activity_type": "teaching",
  "activity_id": 15,
  "comment": "Activité conforme - Validé"
}
```

**Response (200):**
```json
{
  "message": "Activity validated successfully",
  "new_status": "validated",
  "validated_by": "Dr. Bernard",
  "notification_sent": true
}
```

**Authorization:**
- Requiert rôle: `chef_departement`, `admin`, ou `super_admin`
- Status : `pending` → `validated`
- Notification envoyée à l'enseignant

---

#### Action: Reject (Rejeter)

**Request:**
```json
{
  "action": "reject",
  "activity_type": "teaching",
  "activity_id": 15,
  "comment": "Heures non justifiées - Merci de corriger"
}
```

**Response (200):**
```json
{
  "message": "Activity rejected",
  "new_status": "rejected",
  "rejected_by": "Dr. Bernard",
  "notification_sent": true
}
```

**Authorization:**
- Requiert rôle: `chef_departement`, `admin`, ou `super_admin`
- Status : `pending` → `rejected`
- Notification envoyée à l'enseignant

---

#### Action: Request Revision (Demander révision)

**Request:**
```json
{
  "action": "request_revision",
  "activity_type": "teaching",
  "activity_id": 15,
  "comment": "Merci de préciser les dates des cours"
}
```

**Response (200):**
```json
{
  "message": "Revision requested",
  "new_status": "draft",
  "notification_sent": true
}
```

**Authorization:**
- Requiert rôle: `chef_departement`, `admin`, ou `super_admin`
- Status : `pending` → `draft`
- L'enseignant peut modifier et resoumettre

---

### GET /api/workflow

Récupérer l'historique des validations.

**Query Parameters (required):**
- `activity_type`: teaching, supervision, research, exam, responsibility
- `activity_id`: ID de l'activité

**Response (200):**
```json
{
  "validations": [
    {
      "id": 1,
      "action": "submit",
      "status_before": "draft",
      "status_after": "pending",
      "validated_by": null,
      "comment": null,
      "created_at": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "action": "validate",
      "status_before": "pending",
      "status_after": "validated",
      "validated_by": "Dr. Bernard Martin",
      "comment": "Activité conforme - Validé",
      "created_at": "2024-01-16T14:30:00Z"
    }
  ]
}
```

---

## 📊 Calculations & Performance

### GET /api/calculations

Récupérer les indicateurs de performance calculés.

**Query Parameters:**
- `academic_year` (optional): Ex: "2023-2024"

**Response (200):**
```json
{
  "academic_year": "2023-2024",
  "metrics": {
    "teaching_hours": {
      "CM": 84,
      "TD": 56,
      "TP": 48,
      "total": 188
    },
    "supervisions": {
      "PFE_Encadrant": 8,
      "PFE_Rapporteur": 3,
      "PFE_President": 2,
      "Memoire_Encadrant": 2,
      "These_Directeur": 1,
      "total": 16
    },
    "research": {
      "articles": 8,
      "scopus_q1": 3,
      "scopus_q2": 2,
      "conferences": 4,
      "total": 12
    },
    "exams": {
      "hours": 42
    },
    "responsibilities": {
      "hours": 120
    }
  },
  "performance_score": 1847.5,
  "prime_amount": 9237.50,
  "calculated_at": "2024-01-20T09:00:00Z"
}
```

---

### POST /api/calculations

Lancer un calcul de performance.

**Request:**
```json
{
  "academic_year": "2023-2024",
  "recalculate": false
}
```

**Response (200):**
```json
{
  "message": "Performance calculation completed",
  "academic_year": "2023-2024",
  "performance_score": 1847.5,
  "prime_amount": 9237.50,
  "breakdown": {
    "teaching_points": 188.0,
    "supervision_points": 205.0,
    "research_points": 1390.0,
    "exam_points": 21.0,
    "responsibility_points": 43.5
  },
  "calculated_at": "2024-01-20T09:00:00Z"
}
```

**Calculation Formula:**

```
Points par activité:
- Enseignement: 1 point par heure
- PFE Encadrant: 10 points
- PFE Rapporteur: 5 points
- Mémoire Encadrant: 15 points
- Thèse Directeur: 50 points
- Article Scopus Q1: 100 points
- Article Scopus Q2: 80 points
- Article Scopus Q3/Q4: 50 points
- Conférence internationale: 30 points
- Surveillance examens: 0.5 point par heure
- Responsabilités: Variable selon type

Score total = Somme de tous les points

Prime = Base × (Score / 1000) × Multiplicateur
```

---

## 📄 Reports Generation

### POST /api/reports/generate

Générer un rapport PDF annuel.

**Request:**
```json
{
  "academic_year": "2023-2024"
}
```

**Response (200):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="rapport_2023-2024_nessrine-tlili.pdf"

[Binary PDF data]
```

**Contenu du rapport généré:**
1. En-tête avec logo et titre
2. Informations utilisateur (nom, email, département)
3. Période académique
4. Section Enseignement (tableau détaillé)
5. Section Encadrement (tableau par type)
6. Section Recherche (tableau publications)
7. Section Examens (tableau surveillances)
8. Section Responsabilités (tableau détaillé)
9. Résumé statistique global
10. Indicateurs de performance
11. Pied de page avec date et numéro de page

---

### GET /api/reports

Liste des rapports générés.

**Response (200):**
```json
{
  "reports": [
    {
      "id": 1,
      "academic_year": "2023-2024",
      "file_path": "/reports/2023-2024/nessrine-tlili-42.pdf",
      "generated_at": "2024-01-20T10:00:00Z",
      "file_size": 245678
    }
  ]
}
```

---

### GET /api/reports/[id]/download

Télécharger un rapport existant.

**Response (200):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="rapport_2023-2024_nessrine-tlili.pdf"

[Binary PDF data]
```

---

## 🔔 Notifications

### GET /api/notifications

Récupérer les notifications de l'utilisateur.

**Query Parameters:**
- `unread_only` (optional): true/false

**Response (200):**
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "activity_submitted",
      "message": "Nessrine Tlili a soumis une activité d'enseignement pour validation",
      "related_type": "teaching",
      "related_id": 15,
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "type": "activity_validated",
      "message": "Votre activité d'enseignement a été validée par Dr. Bernard",
      "related_type": "teaching",
      "related_id": 15,
      "is_read": true,
      "created_at": "2024-01-16T14:30:00Z"
    }
  ],
  "unread_count": 1
}
```

**Notification Types:**
- `activity_submitted` - Activité soumise
- `activity_validated` - Activité validée
- `activity_rejected` - Activité rejetée
- `revision_requested` - Révision demandée
- `calculation_completed` - Calcul de prime complété
- `report_generated` - Rapport généré

---

### PUT /api/notifications

Marquer une notification comme lue.

**Request:**
```json
{
  "notification_id": 1
}
```

**Response (200):**
```json
{
  "message": "Notification marked as read"
}
```

---

## 📈 Analytics

### GET /api/analytics

Statistiques globales de la plateforme.

**Response (200):**
```json
{
  "period": "2023-2024",
  "users": {
    "total": 156,
    "by_role": {
      "enseignant": 142,
      "chef_departement": 8,
      "admin": 5,
      "super_admin": 1
    }
  },
  "activities": {
    "teaching": {
      "total": 1245,
      "validated": 1102,
      "pending": 98,
      "draft": 45
    },
    "supervision": {
      "total": 456,
      "by_type": {
        "PFE": 320,
        "Memoire": 98,
        "Stage": 28,
        "These": 10
      }
    },
    "research": {
      "total": 289,
      "by_indexation": {
        "Scopus": 156,
        "Web of Science": 89,
        "IEEE": 44
      }
    }
  },
  "performance": {
    "average_score": 842.5,
    "total_primes": 653875.00,
    "top_performers": [
      {
        "name": "Dr. Ahmed Mansour",
        "score": 2456.0,
        "prime": 12280.00
      }
    ]
  }
}
```

---

## 🔒 Admin Routes

### GET /api/admin/departments/stats

Statistiques par département (Admin seulement).

**Authorization:** Requiert rôle `admin` ou `super_admin`

**Response (200):**
```json
{
  "departments": [
    {
      "id": 1,
      "name": "Département Informatique",
      "staff_count": 45,
      "activities": {
        "teaching_hours": 5678,
        "supervisions": 156,
        "publications": 89
      },
      "average_score": 945.2,
      "total_primes": 212450.00
    }
  ]
}
```

---

### GET /api/admin/users

Liste des utilisateurs (Admin seulement).

**Authorization:** Requiert rôle `admin` ou `super_admin`

**Query Parameters:**
- `department_id` (optional)
- `role` (optional)

**Response (200):**
```json
{
  "users": [
    {
      "id": 42,
      "name": "Nessrine Tlili",
      "email": "nessrine.tlili@esprit.tn",
      "role": "enseignant",
      "department_name": "Département Informatique",
      "last_login": "2024-01-20T08:30:00Z",
      "is_active": true
    }
  ]
}
```

---

## ❌ Codes d'Erreur

### Réponses Standard

#### 400 Bad Request
```json
{
  "error": "Invalid input data",
  "details": {
    "planned_hours": "Must be a positive number",
    "semester": "Must be 1 or 2"
  }
}
```

#### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "No valid token provided"
}
```

#### 403 Forbidden
```json
{
  "error": "Insufficient permissions",
  "message": "Admin role required"
}
```

#### 404 Not Found
```json
{
  "error": "Resource not found",
  "message": "Teaching activity with id 999 not found"
}
```

#### 409 Conflict
```json
{
  "error": "Resource already exists",
  "message": "Email already registered"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "trace_id": "abc123xyz"
}
```

---

## 📝 Notes d'Implémentation

### Headers Requis

Toutes les routes (sauf auth) requièrent :
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Rate Limiting

- Routes `/api/auth/login`: 5 requêtes par minute
- Routes `/api/*`: 100 requêtes par 15 minutes
- Dépassement : HTTP 429 Too Many Requests

### Pagination

Pour les grandes listes, utiliser :
```
?page=1&limit=50
```

Réponse inclura :
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "pages": 5
  }
}
```

### Versioning

API Version actuelle : `v1`
URL : `/api/v1/*` (actuellement `/api/*` pointe vers v1)

---

## 🧪 Exemples de Tests

### Test avec cURL

```bash
# Login
curl -X POST https://activities.esprit.tn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nessrine.tlili@esprit.tn","password":"password123"}'

# Créer une activité
curl -X POST https://activities.esprit.tn/api/teaching \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"formation_id":3,"class_id":5,"module_id":12,"activity_type":"CM","planned_hours":42,"completed_hours":40,"academic_year":"2023-2024","semester":1}'

# Soumettre pour validation
curl -X POST https://activities.esprit.tn/api/workflow \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"action":"submit","activity_type":"teaching","activity_id":15}'
```

### Test avec JavaScript (Fetch API)

```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'nessrine.tlili@esprit.tn',
    password: 'password123'
  })
});

const { token } = await loginResponse.json();

// Créer une activité
const createResponse = await fetch('/api/teaching', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    formation_id: 3,
    class_id: 5,
    module_id: 12,
    activity_type: 'CM',
    planned_hours: 42,
    completed_hours: 40,
    academic_year: '2023-2024',
    semester: 1
  })
});

const newActivity = await createResponse.json();
```

---

**Version API:** 1.0.0  
**Dernière mise à jour:** Janvier 2024

Pour toute question : support-api@esprit.tn
