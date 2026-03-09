type UserRole = 'enseignant' | 'chef_departement' | 'admin' | 'super_admin';
type ActivityStatus = 'draft' | 'submitted' | 'validated' | 'approved' | 'rejected';
type ReportStatus = 'draft' | 'ready' | 'archived';

interface DemoUserInternal {
  id: string;
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role: UserRole;
  departement?: string;
  createdAt: string;
  lastLogin?: string;
}

interface DemoActivityInternal {
  id: string;
  userId: string;
  typeActivite: string;
  titre: string;
  dateDebut: string;
  dateFin: string;
  heures: number;
  description: string;
  status: ActivityStatus;
  createdAt: string;
  updatedAt?: string;
}

interface DemoValidationInternal {
  id: string;
  activityId: string;
  validatorId: string;
  status: 'approved' | 'rejected';
  comment?: string;
  validatedAt: string;
}

interface DemoReportInternal {
  id: string;
  userId: string;
  anneeAcademique: string;
  createdAt: string;
  status: ReportStatus;
  pageCount: number;
}

interface DemoStore {
  users: DemoUserInternal[];
  activities: DemoActivityInternal[];
  validations: DemoValidationInternal[];
  reports: DemoReportInternal[];
}

const globalDemoStore = globalThis as typeof globalThis & {
  __espritDemoStore?: DemoStore;
};

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function createInitialStore(): DemoStore {
  return {
    users: [
      {
        id: 'demo-enseignant',
        email: 'nessrine.tlili@esprit.tn',
        password: 'password123',
        nom: 'Tlili',
        prenom: 'Nessrine',
        role: 'enseignant',
        departement: 'Informatique',
        createdAt: '2024-09-01T08:00:00.000Z',
        lastLogin: '2025-03-01T10:00:00.000Z',
      },
      {
        id: 'demo-chef',
        email: 'chef@esprit.tn',
        password: 'password123',
        nom: 'Département',
        prenom: 'Chef',
        role: 'chef_departement',
        departement: 'Informatique',
        createdAt: '2024-09-01T08:00:00.000Z',
        lastLogin: '2025-03-01T10:30:00.000Z',
      },
      {
        id: 'demo-admin',
        email: 'admin@esprit.tn',
        password: 'password123',
        nom: 'Admin',
        prenom: 'Super',
        role: 'admin',
        departement: 'Direction',
        createdAt: '2024-09-01T08:00:00.000Z',
        lastLogin: '2025-03-01T11:00:00.000Z',
      },
    ],
    activities: [
      {
        id: 'demo-activity-1',
        userId: 'demo-enseignant',
        typeActivite: 'enseignement',
        titre: 'Cours de Développement Web',
        dateDebut: '2024-10-10',
        dateFin: '2024-10-10',
        heures: 4,
        description: 'Animation du module React et Next.js pour les étudiants de 3ème année.',
        status: 'validated',
        createdAt: '2024-10-10T12:00:00.000Z',
      },
      {
        id: 'demo-activity-2',
        userId: 'demo-enseignant',
        typeActivite: 'recherche',
        titre: 'Publication scientifique IA',
        dateDebut: '2024-11-15',
        dateFin: '2024-11-20',
        heures: 12,
        description: 'Rédaction et soumission d’un article sur l’optimisation des modèles IA.',
        status: 'validated',
        createdAt: '2024-11-20T15:00:00.000Z',
      },
      {
        id: 'demo-activity-3',
        userId: 'demo-enseignant',
        typeActivite: 'conference',
        titre: 'Conférence DevOps Campus',
        dateDebut: '2025-02-08',
        dateFin: '2025-02-08',
        heures: 3,
        description: 'Participation comme intervenant à une conférence interne.',
        status: 'submitted',
        createdAt: '2025-02-08T09:30:00.000Z',
      },
      {
        id: 'demo-activity-4',
        userId: 'demo-chef',
        typeActivite: 'responsabilite',
        titre: 'Pilotage du comité pédagogique',
        dateDebut: '2024-09-15',
        dateFin: '2025-01-30',
        heures: 18,
        description: 'Coordination des réunions pédagogiques et validation des plans de charge.',
        status: 'validated',
        createdAt: '2025-01-30T17:00:00.000Z',
      },
      {
        id: 'demo-activity-5',
        userId: 'demo-chef',
        typeActivite: 'jury',
        titre: 'Présidence de jury PFE',
        dateDebut: '2025-02-14',
        dateFin: '2025-02-14',
        heures: 6,
        description: 'Organisation et présidence des soutenances de projets de fin d’études.',
        status: 'submitted',
        createdAt: '2025-02-14T16:00:00.000Z',
      },
      {
        id: 'demo-activity-6',
        userId: 'demo-admin',
        typeActivite: 'evenement',
        titre: 'Organisation de la journée innovation',
        dateDebut: '2024-12-05',
        dateFin: '2024-12-05',
        heures: 8,
        description: 'Supervision logistique et académique de l’événement innovation campus.',
        status: 'validated',
        createdAt: '2024-12-05T18:30:00.000Z',
      },
      {
        id: 'demo-activity-7',
        userId: 'demo-admin',
        typeActivite: 'supervision',
        titre: 'Encadrement transversal des stages',
        dateDebut: '2025-01-20',
        dateFin: '2025-01-25',
        heures: 10,
        description: 'Suivi administratif et académique d’un groupe d’étudiants en stage.',
        status: 'validated',
        createdAt: '2025-01-25T13:00:00.000Z',
      },
    ],
    validations: [],
    reports: [
      {
        id: 'demo-report-1',
        userId: 'demo-enseignant',
        anneeAcademique: '2024-2025',
        createdAt: '2025-01-15T14:00:00.000Z',
        status: 'ready',
        pageCount: 3,
      },
      {
        id: 'demo-report-2',
        userId: 'demo-chef',
        anneeAcademique: '2024-2025',
        createdAt: '2025-02-05T09:00:00.000Z',
        status: 'ready',
        pageCount: 2,
      },
      {
        id: 'demo-report-3',
        userId: 'demo-admin',
        anneeAcademique: '2024-2025',
        createdAt: '2025-02-10T11:15:00.000Z',
        status: 'ready',
        pageCount: 3,
      },
    ],
  };
}

function getStore() {
  if (!globalDemoStore.__espritDemoStore) {
    globalDemoStore.__espritDemoStore = createInitialStore();
  }

  return globalDemoStore.__espritDemoStore;
}

function sanitizeUser(user: DemoUserInternal) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function normalizeDate(date?: string) {
  if (!date) return new Date().toISOString().split('T')[0];
  return date.includes('T') ? date.split('T')[0] : date;
}

function numericYear(value?: string) {
  if (!value) return new Date().getFullYear();
  const match = value.match(/\d{4}/);
  return match ? Number(match[0]) : new Date().getFullYear();
}

export function formatAcademicYear(value?: string) {
  const year = numericYear(value);
  return `${year}-${year + 1}`;
}

export function getActivityLabel(type?: string) {
  const labels: Record<string, string> = {
    enseignement: 'Enseignement',
    recherche: 'Recherche Scientifique',
    supervision: 'Encadrement & Jurys',
    jury: 'Jury',
    conference: 'Conférence',
    responsabilite: 'Responsabilités Académiques',
    surveillance: 'Surveillance d\'Examen',
    evenement: 'Événement Scientifique',
  };

  return labels[type || ''] || 'Activité académique';
}

export function parseDetails(details: unknown) {
  if (!details) return {} as Record<string, any>;

  if (typeof details === 'object') {
    return details as Record<string, any>;
  }

  if (typeof details === 'string') {
    try {
      return JSON.parse(details) as Record<string, any>;
    } catch {
      return {} as Record<string, any>;
    }
  }

  return {} as Record<string, any>;
}

export function mapActivityToClient(activity: any) {
  const details = parseDetails(activity.details);
  const typeActivite = activity.typeActivite || activity.type || details.typeActivite || 'enseignement';
  const titre = activity.titre || activity.title || details.titre || details.title || getActivityLabel(typeActivite);
  const dateDebut = normalizeDate(activity.dateDebut || activity.startDate);
  const dateFin = normalizeDate(activity.dateFin || activity.endDate || activity.dateDebut || activity.startDate);
  const heures = Number(activity.heures ?? activity.hours ?? details.heures ?? details.hours ?? 0);

  return {
    id: String(activity.id),
    typeActivite,
    type: typeActivite,
    titre,
    title: titre,
    dateDebut,
    startDate: dateDebut,
    dateFin,
    endDate: dateFin,
    heures,
    hours: heures,
    description: activity.description || details.description || '',
    status: (activity.status || 'draft') as ActivityStatus,
    createdAt: activity.createdAt || activity.dateCreation || nowIso(),
    updatedAt: activity.updatedAt,
    validationCount: Number(activity.validationCount ?? 0),
  };
}

export function mapReportToClient(report: any) {
  const academicYear = formatAcademicYear(report.anneeAcademique || report.academicYear);
  const rawStatus = String(report.status || 'ready');
  const status: ReportStatus = rawStatus === 'generated' ? 'ready' : (rawStatus as ReportStatus);

  return {
    id: String(report.id),
    titre: report.titre || `Rapport ${academicYear}`,
    title: report.titre || `Rapport ${academicYear}`,
    anneeAcademique: academicYear,
    academicYear,
    createdAt: report.createdAt || report.generatedAt || nowIso(),
    generatedAt: report.generatedAt || report.createdAt || nowIso(),
    status,
    pageCount: Number(report.pageCount ?? 1),
  };
}

export function isDemoUser(userId: string) {
  return getStore().users.some((user) => user.id === userId);
}

export function validateDemoCredentials(email: string, password: string) {
  const store = getStore();
  const user = store.users.find((item) => item.email.toLowerCase() === email.toLowerCase());

  if (!user || user.password !== password) {
    return null;
  }

  user.lastLogin = nowIso();
  return sanitizeUser(user);
}

export function listDemoUsers() {
  return getStore().users.map(sanitizeUser);
}

export function getDemoUserById(userId: string) {
  const user = getStore().users.find((item) => item.id === userId);
  return user ? sanitizeUser(user) : null;
}

export function createDemoUser(data: {
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  departement?: string;
}) {
  const store = getStore();

  if (store.users.some((user) => user.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error('User already exists');
  }

  const tempPassword = Math.random().toString(36).slice(-8);
  const user: DemoUserInternal = {
    id: createId('demo-user'),
    email: data.email,
    password: tempPassword,
    nom: data.nom,
    prenom: data.prenom,
    role: data.role,
    departement: data.departement,
    createdAt: nowIso(),
  };

  store.users.unshift(user);

  return {
    user: sanitizeUser(user),
    tempPassword,
  };
}

export function updateDemoUser(userId: string, data: Partial<Pick<DemoUserInternal, 'nom' | 'prenom' | 'departement'>>) {
  const store = getStore();
  const user = store.users.find((item) => item.id === userId);

  if (!user) return null;

  if (data.nom !== undefined) user.nom = data.nom;
  if (data.prenom !== undefined) user.prenom = data.prenom;
  if (data.departement !== undefined) user.departement = data.departement;

  return sanitizeUser(user);
}

export function listDemoActivities(userId: string) {
  return getStore().activities
    .filter((activity) => activity.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((activity) => mapActivityToClient(activity));
}

export function getDemoActivity(userId: string, activityId: string) {
  const activity = getStore().activities.find((item) => item.id === activityId && item.userId === userId);
  return activity ? mapActivityToClient(activity) : null;
}

export function createDemoActivity(
  userId: string,
  data: {
    titre?: string;
    typeActivite?: string;
    dateDebut?: string;
    dateFin?: string;
    heures?: number;
    description?: string;
  }
) {
  const store = getStore();
  const activity: DemoActivityInternal = {
    id: createId('demo-activity'),
    userId,
    typeActivite: data.typeActivite || 'enseignement',
    titre: data.titre || getActivityLabel(data.typeActivite),
    dateDebut: normalizeDate(data.dateDebut),
    dateFin: normalizeDate(data.dateFin || data.dateDebut),
    heures: Number(data.heures ?? 0),
    description: data.description || '',
    status: 'submitted',
    createdAt: nowIso(),
  };

  store.activities.unshift(activity);
  return mapActivityToClient(activity);
}

export function updateDemoActivity(
  userId: string,
  activityId: string,
  data: {
    titre?: string;
    typeActivite?: string;
    dateDebut?: string;
    dateFin?: string;
    heures?: number;
    description?: string;
  }
) {
  const store = getStore();
  const activity = store.activities.find((item) => item.id === activityId && item.userId === userId);

  if (!activity) return null;

  activity.titre = data.titre || activity.titre;
  activity.typeActivite = data.typeActivite || activity.typeActivite;
  activity.dateDebut = normalizeDate(data.dateDebut || activity.dateDebut);
  activity.dateFin = normalizeDate(data.dateFin || activity.dateFin);
  activity.heures = Number(data.heures ?? activity.heures);
  activity.description = data.description ?? activity.description;
  activity.updatedAt = nowIso();
  activity.status = activity.status === 'rejected' ? 'submitted' : activity.status;

  return mapActivityToClient(activity);
}

export function deleteDemoActivity(userId: string, activityId: string) {
  const store = getStore();
  const initialLength = store.activities.length;
  store.activities = store.activities.filter((item) => !(item.id === activityId && item.userId === userId));
  return store.activities.length !== initialLength;
}

export function listDemoValidations(currentUserId: string) {
  const store = getStore();

  return store.activities
    .filter((activity) => activity.status === 'submitted' && activity.userId !== currentUserId)
    .map((activity) => {
      const owner = store.users.find((user) => user.id === activity.userId);
      return {
        id: activity.id,
        activityId: activity.id,
        userName: owner ? `${owner.prenom} ${owner.nom}` : 'Utilisateur',
        userEmail: owner?.email || 'unknown@esprit.tn',
        typeActivite: activity.typeActivite,
        titre: activity.titre,
        dateDebut: activity.dateDebut,
        dateFin: activity.dateFin,
        description: activity.description,
      };
    });
}

export function saveDemoValidation(
  validatorId: string,
  activityId: string,
  status: 'approved' | 'rejected',
  comment?: string
) {
  const store = getStore();
  const activity = store.activities.find((item) => item.id === activityId);

  if (!activity) return null;

  const validation: DemoValidationInternal = {
    id: createId('demo-validation'),
    activityId,
    validatorId,
    status,
    comment,
    validatedAt: nowIso(),
  };

  activity.status = status === 'approved' ? 'validated' : 'rejected';
  activity.updatedAt = validation.validatedAt;
  store.validations.unshift(validation);

  return validation;
}

export function listDemoReports(userId: string) {
  return getStore().reports
    .filter((report) => report.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((report) => mapReportToClient(report));
}

export function createDemoReport(userId: string, academicYearInput?: string) {
  const store = getStore();
  const academicYear = formatAcademicYear(academicYearInput);
  const year = numericYear(academicYear);
  const activities = store.activities.filter(
    (activity) =>
      activity.userId === userId &&
      activity.status === 'validated' &&
      numericYear(activity.dateDebut) === year
  );

  const report: DemoReportInternal = {
    id: createId('demo-report'),
    userId,
    anneeAcademique: academicYear,
    createdAt: nowIso(),
    status: 'ready',
    pageCount: Math.max(1, activities.length + 1),
  };

  store.reports.unshift(report);
  return mapReportToClient(report);
}

export function getDemoReport(userId: string, reportId: string) {
  const store = getStore();
  const report = store.reports.find((item) => item.id === reportId && item.userId === userId);
  const user = store.users.find((item) => item.id === userId);

  if (!report || !user) return null;

  const year = numericYear(report.anneeAcademique);
  const activities = store.activities
    .filter(
      (activity) =>
        activity.userId === userId &&
        activity.status === 'validated' &&
        numericYear(activity.dateDebut) === year
    )
    .map((activity) => mapActivityToClient(activity));

  return {
    report: mapReportToClient(report),
    user: sanitizeUser(user),
    activities,
  };
}

export function deleteDemoReport(userId: string, reportId: string) {
  const store = getStore();
  const initialLength = store.reports.length;
  store.reports = store.reports.filter((report) => !(report.id === reportId && report.userId === userId));
  return store.reports.length !== initialLength;
}
