import { websiteKnowledge } from './knowledge.mjs';

const stop = new Set('a an and are as at be can do does for from have how i in is it landco llc me my of on or our that the their this to us we what when which with work you your yall y all provide handle help need information about please tell'.split(' '));
function tokens(text) {
  return [...new Set(String(text).toLowerCase().replace(/haul[- ]?off|haul away/g, 'haul debris').replace(/homes?|houses?/g, 'house').replace(/cut and fill/g, 'grading').replace(/yard leveling/g, 'yard grading').replace(/municipal/g, 'government').replace(/\bprep\b/g, 'preparation').replace(/drawings?/g, 'plans').replace(/[^a-z0-9]+/g, ' ').split(' ').filter(t => t && !stop.has(t)).map(t => t.replace(/ing$|s$/g, '')))];
}
export function searchWebsite(question) {
  const q = tokens(question);
  if (!q.length) return [];
  return websiteKnowledge.map(entry => {
    const title = tokens(entry.title), body = tokens(entry.text);
    const matches = q.filter(t => title.includes(t)).length;
    const coverage = matches / q.length;
    const score = coverage * 4 + matches / Math.max(title.length, 1) + q.filter(t => body.includes(t)).length / q.length * .4;
    return { ...entry, score, matches, coverage };
  }).filter(x => x.matches && x.coverage >= .6 && (x.matches >= 2 || q.length === 1)).sort((a, b) => b.score - a.score).slice(0, 3);
}

export function websiteAnswer(question) {
  const hit = searchWebsite(question)[0];
  if (!hit) return null;
  const service = hit.url === '/grading' ? 'Grading / House Pad' : hit.url === '/land-clearing' ? 'Land Clearing' : /drain/.test(hit.url) ? 'Drainage Correction' : '';
  return {reply: hit.text, service, links: [{label: hit.title, url: hit.url}]};
}
