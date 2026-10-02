export const intakeSteps = [
  {key:'name', question:'What name should Zach put on your request?', placeholder:'Your name', type:'text', autocomplete:'name', max:100},
  {key:'phone', question:'What’s the best phone number to reach you?', placeholder:'Phone number', type:'tel', autocomplete:'tel', max:30},
  {key:'email', question:'What email should we use for your project details?', placeholder:'Email address', type:'email', autocomplete:'email', max:254},
  {key:'location', question:'Where is the project? An address or city is enough to get started.', placeholder:'Project address or city', type:'text', autocomplete:'street-address', max:200},
  {key:'details', question:'What would you like done? One sentence is enough to start.', placeholder:'Tell us what needs fixing', type:'text', autocomplete:'off', max:1000}
];

export function validateIntake(key, value) {
  const text = String(value || '').trim();
  if (key === 'name' && text.length < 2) return 'Please enter the name we should use.';
  if (key === 'phone' && !/^\+?[\d\s().-]+$/.test(text)) return 'Please enter a phone number, including the area code.';
  if (key === 'phone' && (text.replace(/\D/g,'').length < 10 || text.replace(/\D/g,'').length > 15)) return 'Please include the area code so Zach can reach you.';
  if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return 'Please enter a valid email address.';
  if (key === 'location' && text.length < 2) return 'Please enter the project address or city.';
  if (key === 'details' && text.length < 5) return 'Tell us briefly what you would like done.';
  return '';
}
