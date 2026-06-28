export type PassageWrapperAttrs = {
  border: boolean;
};

const EMPTY_PASSAGE_ATTRS: PassageWrapperAttrs = {
  border: false,
};

function parsePassageWrapperInner(inner: string): PassageWrapperAttrs | null {
  const tokens = inner.trim().split(/\s+/).filter(Boolean);
  let border = false;

  for (const token of tokens) {
    if (token === "border") {
      border = true;
      continue;
    }

    return null;
  }

  return { border };
}

function parsePassageOpenTagInner(content: string, index: number) {
  const prefix = "[passage";
  if (!content.startsWith(prefix, index)) {
    return null;
  }

  const closeBracket = content.indexOf("]", index);
  if (closeBracket === -1) {
    return null;
  }

  const tag = content.slice(index, closeBracket + 1);
  if (!tag.startsWith(prefix) || !tag.endsWith("]")) {
    return null;
  }

  const inner = tag.slice(prefix.length, -1);
  const attrs = parsePassageWrapperInner(inner);
  if (!attrs) {
    return null;
  }

  return {
    length: tag.length,
    attrs,
  };
}

export function findPassageOpenIndex(content: string, fromIndex = 0) {
  return content.indexOf("[passage", fromIndex);
}

export function findPassageCloseIndex(content: string, fromIndex = 0) {
  return content.indexOf("[/passage]", fromIndex);
}

export function parsePassageOpenTag(content: string, index: number) {
  return parsePassageOpenTagInner(content, index);
}

export function parsePassageCloseTag(content: string, index: number) {
  if (!content.startsWith("[/passage", index)) {
    return null;
  }

  const closeBracket = content.indexOf("]", index);
  if (closeBracket === -1) {
    return null;
  }

  const tag = content.slice(index, closeBracket + 1);
  if (tag !== "[/passage]") {
    return null;
  }

  return {
    length: tag.length,
  };
}

export function hasPassageWrapperMarkers(content: string) {
  return findPassageOpenIndex(content) >= 0 || findPassageCloseIndex(content) >= 0;
}

export function getEmptyPassageWrapperAttrs(): PassageWrapperAttrs {
  return EMPTY_PASSAGE_ATTRS;
}
