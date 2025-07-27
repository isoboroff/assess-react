import LANGUAGE_FALLBACKS from "./fallbacks.json" with { type: "json" };

import languages from "./languages/index.js";

function getLanguageClass(language) {
  if (language in languages) {
    return languages[language];
  }

  const fallbacks = LANGUAGE_FALLBACKS[language] || ["en"];
  for (const fallbackLanguage of fallbacks) {
    const cls = getLanguageClass(fallbackLanguage);
    if (cls) {
      return cls;
    }
  }
}

export default function segment(language, text) {
  const className = getLanguageClass(language);
  return new className().segment(text);
}
