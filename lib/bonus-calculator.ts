import { Pool } from 'pg';

export interface BonusCalculationResult {
  totalBonus: number;
  breakdown: {
    teachingBonus: number;
    researchBonus: number;
    supervisionBonus: number;
    responsibilityBonus: number;
  };
  activities: {
    teachingHours: number;
    researchPublications: number;
    supervisions: number;
    responsibilities: number;
  };
}

const BONUS_RATES = {
  TEACHING_PER_HOUR: 10, // 10 DT per hour
  RESEARCH_PUBLICATION: 100, // 100 DT per publication
  SUPERVISION: 50, // 50 DT per supervision
  JURY_PARTICIPATION: 40, // 40 DT per jury
  RESPONSIBILITY: 200, // 200 DT per responsibility
  CONFERENCE: 80, // 80 DT per conference
};

export async function calculateBonus(
  enseignantId: string,
  academicYear: string,
  pool: Pool
): Promise<BonusCalculationResult> {
  try {
    // Get all validated activities for the academic year
    const activitiesResult = await pool.query(
      `SELECT a.*, ah.heures_realisees 
       FROM activites a 
       LEFT JOIN activite_heures ah ON a.id = ah.id_activite
       WHERE a.id_enseignant = $1 
       AND EXTRACT(YEAR FROM a.date_debut) = EXTRACT(YEAR FROM $2::date)
       AND a.status = 'approved'`,
      [enseignantId, academicYear + '-01-01']
    );

    const activities = activitiesResult.rows;
    let breakdown = {
      teachingBonus: 0,
      researchBonus: 0,
      supervisionBonus: 0,
      responsibilityBonus: 0,
    };

    let activityCounts = {
      teachingHours: 0,
      researchPublications: 0,
      supervisions: 0,
      responsibilities: 0,
    };

    for (const activity of activities) {
      switch (activity.type_activite) {
        case 'enseignement':
          const hours = activity.heures_realisees || 0;
          breakdown.teachingBonus += hours * BONUS_RATES.TEACHING_PER_HOUR;
          activityCounts.teachingHours += hours;
          break;

        case 'recherche':
          breakdown.researchBonus += BONUS_RATES.RESEARCH_PUBLICATION;
          activityCounts.researchPublications += 1;
          break;

        case 'encadrement':
          breakdown.supervisionBonus += BONUS_RATES.SUPERVISION;
          activityCounts.supervisions += 1;
          break;

        case 'jury':
          breakdown.supervisionBonus += BONUS_RATES.JURY_PARTICIPATION;
          activityCounts.supervisions += 1;
          break;

        case 'responsabilites':
          breakdown.responsibilityBonus += BONUS_RATES.RESPONSIBILITY;
          activityCounts.responsibilities += 1;
          break;

        case 'conference':
          breakdown.supervisionBonus += BONUS_RATES.CONFERENCE;
          break;
      }
    }

    const totalBonus =
      breakdown.teachingBonus +
      breakdown.researchBonus +
      breakdown.supervisionBonus +
      breakdown.responsibilityBonus;

    return {
      totalBonus,
      breakdown,
      activities: activityCounts,
    };
  } catch (error) {
    console.error('Bonus calculation error:', error);
    throw error;
  }
}

export async function storeBonusCalculation(
  enseignantId: string,
  academicYear: string,
  amount: number,
  pool: Pool
): Promise<string> {
  try {
    const result = await pool.query(
      `INSERT INTO primes (id_enseignant, annee_academique, montant, date_calcul)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id_enseignant, annee_academique) 
       DO UPDATE SET montant = $3, date_calcul = NOW()
       RETURNING id`,
      [enseignantId, academicYear, amount]
    );

    return result.rows[0].id;
  } catch (error) {
    console.error('Error storing bonus calculation:', error);
    throw error;
  }
}
