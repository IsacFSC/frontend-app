export type SkillKey =
  | 'VOCAL_LEAD'
  | 'BACKING_VOCAL'
  | 'VIOLAO'
  | 'SAX'
  | 'GUITARRA'
  | 'TECLADO'
  | 'CONTRA_BAIXO'
  | 'BATERIA'
  | 'MESA_SOM'
  | 'OUTROS'
  | string;

const skillDisplayNames: { [key: string]: string } = {
  VOCAL_LEAD: 'VOZ PRINCIPAL',
  BACKING_VOCAL: 'VOZ DE APOIO',
  VIOLAO: 'VIOLÃO',
  SAX: 'SAX',
  GUITARRA: 'GUITARRA',
  TECLADO: 'TECLADO',
  'CONTRA_BAIXO': 'CONTRA-BAIXO',
  BATERIA: 'BATERIA',
  MESA_SOM: 'MESA DE SOM',
  OUTROS: 'OUTROS',
};

export function formatSkill(skill?: string | null) {
  if (!skill) return '';
  const key = skill as string;
  if (skillDisplayNames[key]) return skillDisplayNames[key];
  return key.replace(/_/g, ' ');
}

export default skillDisplayNames;
