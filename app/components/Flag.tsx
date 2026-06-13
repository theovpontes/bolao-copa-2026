export const COUNTRY_CODE: Record<string, string> = {
  "Mexico": "mx", "South Africa": "za", "South Korea": "kr", "Czechia": "cz",
  "Canada": "ca", "Qatar": "qa", "Switzerland": "ch", "Bosnia and Herzegovina": "ba",
  "Brazil": "br", "Haiti": "ht", "Morocco": "ma", "Scotland": "gb-sct",
  "United States": "us", "Paraguay": "py", "Australia": "au", "Turkey": "tr",
  "Germany": "de", "Curaçao": "cw", "Ecuador": "ec", "Ivory Coast": "ci",
  "Netherlands": "nl", "Japan": "jp", "Tunisia": "tn", "Sweden": "se",
  "Belgium": "be", "Iran": "ir", "Egypt": "eg", "New Zealand": "nz",
  "Spain": "es", "Cape Verde": "cv", "Saudi Arabia": "sa", "Uruguay": "uy",
  "France": "fr", "Senegal": "sn", "Iraq": "iq", "Norway": "no",
  "Argentina": "ar", "Algeria": "dz", "Austria": "at", "Jordan": "jo",
  "Portugal": "pt", "Uzbekistan": "uz", "Colombia": "co", "Congo DR": "cd",
  "England": "gb-eng", "Croatia": "hr", "Ghana": "gh", "Panama": "pa",
};
const SQUARE = new Set(["Switzerland"]);

export function Flag({ team, h = 16 }: { team: string; h?: number }) {
  const code = COUNTRY_CODE[team];
  if (!code) return null;
  const w = SQUARE.has(team) ? h : Math.round(h * 1.5);
  return (
    <img className="flag" src={`https://flagcdn.com/w80/${code}.png`} alt="" loading="lazy"
      style={{ width: w, height: h }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
  );
}
