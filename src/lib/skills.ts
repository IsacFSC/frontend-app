export type Skill =
  | 'MAIN_VOICE'
  | 'GUITAR'
  | 'SOUND_DESK'
  | 'KEYBOARD'
  | 'DRUMS'
  | 'BASS'
  | 'OTHER';

const skillDisplayNames: { [key in Skill]: string } = {
  MAIN_VOICE: 'VOZ PRINCIPAL',
  GUITAR: 'VIOLÃO',
  SOUND_DESK: 'MESA DE SOM',
  KEYBOARD: 'TECLADO',
  DRUMS: 'BATERIA',
  BASS: 'CONTRA-BASSO',
  OTHER: 'OUTRO',
};

export function formatSkill(skill?: string | null) {
  if (!skill) return '';
  // If skill matches one of our known keys, return the Portuguese label
  if (skillDisplayNames[skill as Skill]) return skillDisplayNames[skill as Skill];
  // Fallback: replace underscores and uppercase
  return skill.replace(/_/g, ' ');
}

export default skillDisplayNames;
