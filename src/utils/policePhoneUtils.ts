export const getOfficialPolicePhone = (name: string, fallback: string = "112"): string => {
  const clean = name.toLowerCase().trim();
  if (fallback && fallback !== "112" && fallback !== "100") {
    return fallback;
  }

  const NATIONAL_DIRECTORY: Record<string, string> = {
    'rewa antrela': '07661-235960', 'rewa baikunthpur': '07662-277228',
    'rewa chakghat': '07661-283230', 'rewa chorhata': '07662-220577',
    'rewa civil lines': '07662-254434', 'rewa dabhora': '07661-282950',
    'rewa garh': '07660-284545', 'rewa govindgarh': '07662-261530',
    'rewa hanumana': '07664-288530', 'rewa java': '07661-282230',
    'rewa kotwali': '07662-258557', 'rewa laur': '07663-286231',
    'rewa mangwan': '07660-281218', 'rewa mauganj': '07663-270341',
    'rewa naigarhi': '07663-285119', 'rewa panwar': '07661-235950',
    'rewa raipur': '07662-265204', 'rewa sagra': '07662-263244',
    'rewa semariya': '07660-266549', 'rewa shahpur': '07663-237692',
    'rewa sirmour': '07660-260633', 'rewa sohagi': '07661-282230',
    'rewa university': '07662-240817', 'rewa teonthar': '07662-240817',
    'rewa traffic': '07662-223171', 'rewa mahila': '07661-255700',
    'rewa saman': '07662-258557', 'rewa samaan': '07662-258557',
    'indore palasia': '0731-2522108', 'indore vijay nagar': '0731-2522105',
    'indore bhanwarkuan': '0731-2522110', 'bhopal mp nagar': '0755-2443491',
    'bhopal t t nagar': '0755-2443493', 'patna boring road': '0612-2213344',
    'patna gardanibagh': '0612-2213345', 'jodhpur sardarpura': '0291-2650711'
  };

  for (const [key, phone] of Object.entries(NATIONAL_DIRECTORY)) {
    const parts = key.split(' ');
    if (parts.every(part => clean.includes(part))) {
      return phone;
    }
  }
  return fallback || "112";
};
